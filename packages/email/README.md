# @nucel.cloud/email

Multi-provider email package with support for Resend, Nodemailer, and AWS SES.

## Installation

```bash
pnpm add @nucel.cloud/email
```

## Configuration

Set your email provider using environment variables:

```env
# Choose provider: resend, nodemailer, aws-ses
EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@example.com

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Nodemailer (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS SES
AWS_REGION=us-east-1
# Optional - only needed if not using IAM roles
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

## Usage

### Basic Usage

```typescript
import { sendEmail } from '@nucel.cloud/email';

// Send a simple email
await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  text: 'Thanks for signing up!',
  html: '<h1>Thanks for signing up!</h1>'
});
```

### Using React Email Components

```tsx
import { sendEmail } from '@nucel.cloud/email';
import { WelcomeEmail } from './emails/welcome';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  react: <WelcomeEmail name="John" />
});
```

### Advanced Usage with Client

```typescript
import { EmailClient } from '@nucel.cloud/email';

// Create a client with custom config
const emailClient = new EmailClient({
  provider: 'resend',
  apiKey: 'your-api-key',
  from: 'custom@example.com'
});

// Send email
await emailClient.send({
  to: 'user@example.com',
  subject: 'Hello',
  text: 'Hello world!'
});

// Send batch emails
await emailClient.sendBatch([
  {
    to: 'user1@example.com',
    subject: 'Newsletter',
    html: '<p>Content 1</p>'
  },
  {
    to: 'user2@example.com',
    subject: 'Newsletter',
    html: '<p>Content 2</p>'
  }
]);
```

### Provider-Specific Usage

```typescript
import { ResendProvider, NodemailerProvider, AwsSesProvider } from '@nucel.cloud/email';

// Resend
const resend = new ResendProvider({
  provider: 'resend',
  apiKey: 'your-api-key',
  from: 'noreply@example.com'
});

// Nodemailer
const nodemailer = new NodemailerProvider({
  provider: 'nodemailer',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'user@gmail.com',
    pass: 'password'
  },
  from: 'noreply@example.com'
});

// AWS SES (uses IAM role when running in AWS)
const ses = new AwsSesProvider({
  provider: 'aws-ses',
  region: 'us-east-1',
  from: 'noreply@example.com'
});
```

## API

### `sendEmail(options: SendEmailOptions)`

Send a single email using the default client.

### `EmailClient`

Main client class for sending emails.

- `send(options: SendEmailOptions)` - Send a single email
- `sendBatch(emails: SendEmailOptions[])` - Send multiple emails
- `getProvider()` - Get the current provider name

### `SendEmailOptions`

```typescript
interface SendEmailOptions {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  react?: ReactElement;
  attachments?: EmailAttachment[];
}
```