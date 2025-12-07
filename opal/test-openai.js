const fetch = require('node-fetch');
require('dotenv').config();

async function testOpenAI() {
  console.log('Testing OpenAI API connection...');
  console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
  console.log('API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
  console.log('API Key prefix:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'None');
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API connection successful!');
      console.log(`Available models: ${data.data.length}`);
      console.log('GPT models available:');
      data.data
        .filter(model => model.id.includes('gpt'))
        .slice(0, 5)
        .forEach(model => console.log(`  - ${model.id}`));
    } else {
      const errorText = await response.text();
      console.log('❌ OpenAI API connection failed:');
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ OpenAI API test failed with exception:');
    console.log('Error:', error.message);
  }
}

// Test a simple chat completion
async function testChatCompletion() {
  console.log('\nTesting OpenAI Chat Completion...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Say "Hello, I am working correctly!" in exactly those words.' }
        ],
        max_tokens: 50,
        temperature: 0
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chat completion successful!');
      console.log('Response:', data.choices[0].message.content);
    } else {
      const errorText = await response.text();
      console.log('❌ Chat completion failed:');
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Chat completion test failed:');
    console.log('Error:', error.message);
  }
}

// Run both tests
testOpenAI().then(() => {
  return testChatCompletion();
}).catch(console.error);
