import { 
  S3Client, 
  HeadBucketCommand, 
  CreateBucketCommand, 
  PutBucketEncryptionCommand
} from "@aws-sdk/client-s3";
import chalk from 'chalk';
import ora from 'ora';

export async function ensureS3BucketExists(bucketName: string, region: string): Promise<void> {
  const s3Client = new S3Client({ region });
  const spinner = ora(`Checking S3 bucket: ${bucketName}`).start();

  try {
    // Try to check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    spinner.succeed(`S3 bucket exists: ${bucketName}`);
  } catch (error: unknown) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number }; message?: string };
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      // Bucket doesn't exist, create it
      spinner.text = `Creating S3 bucket: ${bucketName}`;
      
      try {
        // Create bucket - region is already set in S3Client
        await s3Client.send(new CreateBucketCommand({
          Bucket: bucketName
        }));

        // Enable server-side encryption
        await s3Client.send(new PutBucketEncryptionCommand({
          Bucket: bucketName,
          ServerSideEncryptionConfiguration: {
            Rules: [
              {
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256'
                }
              }
            ]
          }
        }));

        spinner.succeed(`Created S3 bucket: ${bucketName}`);
      } catch (createError: unknown) {
        const createErr = createError as { message?: string };
        spinner.fail(`Failed to create S3 bucket: ${bucketName}`);
        console.error(chalk.red(`Error: ${createErr.message || 'Unknown error'}`));
        throw createError;
      }
    } else {
      // Some other error
      spinner.fail(`Error checking S3 bucket: ${bucketName}`);
      console.error(chalk.red(`Error: ${err.message || 'Unknown error'}`));
      throw error;
    }
  }
}