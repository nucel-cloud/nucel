<script>
  let count = 0;
  
  function increment() {
    count += 1;
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
  <div class="container mx-auto px-4 py-16">
    <!-- Hero Section -->
    <div class="text-center mb-16">
      <h1 class="text-6xl font-bold text-white mb-4 animate-pulse">
        Welcome to SvelteKit + Tailwind CSS v4
      </h1>
      <p class="text-xl text-white/90 mb-8">
        Deployed on AWS Lambda with CloudFront
      </p>
      <div class="flex justify-center gap-4">
        <a 
          href="https://svelte.dev/docs/kit" 
          class="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg"
        >
          SvelteKit Docs
        </a>
        <a 
          href="https://tailwindcss.com" 
          class="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors duration-200 shadow-lg"
        >
          Tailwind CSS
        </a>
      </div>
    </div>

    <!-- Feature Grid -->
    <div class="grid md:grid-cols-3 gap-8 mb-16">
      <div class="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-xl hover:scale-105 transition-transform duration-200">
        <div class="text-4xl mb-4">⚡</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Fast Performance</h2>
        <p class="text-gray-600">
          Optimized builds with Vite and served through CloudFront CDN for lightning-fast delivery.
        </p>
      </div>
      
      <div class="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-xl hover:scale-105 transition-transform duration-200">
        <div class="text-4xl mb-4">🎨</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Tailwind CSS v4</h2>
        <p class="text-gray-600">
          Using the latest Tailwind CSS with Vite plugin for optimal development experience.
        </p>
      </div>
      
      <div class="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-xl hover:scale-105 transition-transform duration-200">
        <div class="text-4xl mb-4">☁️</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">AWS Serverless</h2>
        <p class="text-gray-600">
          Deployed on AWS Lambda with automatic scaling and pay-per-use pricing.
        </p>
      </div>
    </div>

    <!-- Interactive Counter -->
    <div class="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-xl max-w-md mx-auto mb-16">
      <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">Interactive Counter</h2>
      <div class="text-center">
        <div class="text-6xl font-bold text-purple-600 mb-6">{count}</div>
        <button 
          on:click={increment}
          class="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Click Me!
        </button>
      </div>
    </div>

    <!-- Tech Stack -->
    <div class="bg-black/80 backdrop-blur-sm rounded-xl p-8 text-white">
      <h2 class="text-3xl font-bold mb-6">Tech Stack</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🚀</span>
          <span>SvelteKit 2.0</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-2xl">🎨</span>
          <span>Tailwind CSS v4</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚙️</span>
          <span>Vite</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-2xl">☁️</span>
          <span>AWS Lambda + CloudFront</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-2xl">📦</span>
          <span>Pulumi Infrastructure as Code</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-2xl">🔄</span>
          <span>Server-Side Rendering</span>
        </div>
      </div>
    </div>

    <!-- Responsive Test -->
    <div class="mt-16 text-center text-white">
      <p class="text-sm opacity-75">Resize your browser to test responsive design</p>
      <div class="mt-2">
        <span class="inline-block px-3 py-1 bg-white/20 rounded-full text-xs sm:hidden">Mobile</span>
        <span class="hidden sm:inline-block md:hidden px-3 py-1 bg-white/20 rounded-full text-xs">Tablet</span>
        <span class="hidden md:inline-block lg:hidden px-3 py-1 bg-white/20 rounded-full text-xs">Desktop</span>
        <span class="hidden lg:inline-block px-3 py-1 bg-white/20 rounded-full text-xs">Large Desktop</span>
      </div>
    </div>
  </div>
</div>