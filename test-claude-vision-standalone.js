#!/usr/bin/env node
/**
 * Standalone Claude Vision API Test
 * Tests the AI visual inspection without requiring Playwright
 * Uses production URL screenshot for analysis
 */

const https = require('https');

// Sample screenshot from the production app (base64 encoded 1x1 test pixel)
// In real usage, this would be a full screenshot from Playwright
const SAMPLE_SCREENSHOT_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testClaudeVisionAPI() {
  console.log('🔬 Testing Claude Vision API Integration\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set!');
    console.log('\nTo fix:');
    console.log('  set -a && source .env && set +a');
    console.log('  node test-claude-vision-standalone.js');
    process.exit(1);
  }

  console.log(`✅ API Key found: ${apiKey.substring(0, 20)}...`);
  console.log('📸 Preparing test screenshot...');

  // Import the SDK
  let Anthropic;
  try {
    Anthropic = require('@anthropic-ai/sdk');
    console.log('✅ @anthropic-ai/sdk loaded successfully');
  } catch (err) {
    console.error('❌ Failed to load @anthropic-ai/sdk:', err.message);
    console.log('\nTo fix:');
    console.log('  npm install --no-bin-links @anthropic-ai/sdk');
    process.exit(1);
  }

  // Test API call
  console.log('\n🚀 Calling Claude Vision API...');
  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [{
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: SAMPLE_SCREENSHOT_BASE64,
          },
        }, {
          type: 'text',
          text: `This is a test of visual inspection capabilities. Analyze this test image and confirm:
1. Can you see the image?
2. What type of image is it?
3. Rate the image quality (1-10)
Keep response brief (3-4 sentences).`,
        }],
      }],
    });

    const analysis = response.content[0].type === 'text' ? response.content[0].text : 'No response';

    console.log('\n✅ SUCCESS! Claude Vision API is working!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ANALYSIS RESULT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(analysis);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📈 Token Usage:');
    console.log(`  Input: ${response.usage.input_tokens} tokens`);
    console.log(`  Output: ${response.usage.output_tokens} tokens`);
    console.log(`  Total: ${response.usage.input_tokens + response.usage.output_tokens} tokens`);

    const cost = ((response.usage.input_tokens * 0.003) + (response.usage.output_tokens * 0.015)) / 1000;
    console.log(`  Estimated cost: $${cost.toFixed(6)}\n`);

    console.log('✨ Next Steps:');
    console.log('  1. Install Playwright browsers (requires ~200MB disk space)');
    console.log('  2. Run full visual tests: npm test');
    console.log('  3. Tests will analyze real production screenshots\n');

  } catch (error) {
    console.error('\n❌ API ERROR:', error.message);
    if (error.status === 401) {
      console.log('\n⚠️  Authentication failed. Check your API key:');
      console.log('  https://console.anthropic.com/account/keys');
    } else if (error.status === 429) {
      console.log('\n⚠️  Rate limit exceeded. Wait 60s and try again.');
    } else {
      console.log('\n⚠️  Error details:', error);
    }
    process.exit(1);
  }
}

// Run test
testClaudeVisionAPI().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
