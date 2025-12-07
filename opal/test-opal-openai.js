const WebSocket = require('ws');

// Test OPAL connection and OpenAI tools
async function testOPALOpenAI() {
  console.log('Testing OPAL connection and OpenAI tools...');
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000');
    let requestId = 1;
    const pendingRequests = new Map();
    
    ws.on('open', async () => {
      console.log('✅ Connected to OPAL server');
      
      try {
        // Initialize MCP session
        console.log('Initializing MCP session...');
        await sendRequest(ws, pendingRequests, {
          jsonrpc: '2.0',
          id: requestId++,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            clientInfo: {
              name: 'TestClient',
              version: '1.0.0'
            },
            capabilities: {
              tools: { listChanged: true },
              resources: { listChanged: true, subscribe: true },
              prompts: { listChanged: true }
            }
          }
        });
        
        // Send initialized notification
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized'
        }));
        
        console.log('✅ MCP session initialized');
        
        // List available tools
        console.log('Fetching available tools...');
        const toolsResult = await sendRequest(ws, pendingRequests, {
          jsonrpc: '2.0',
          id: requestId++,
          method: 'tools/list'
        });
        
        const tools = toolsResult.tools || [];
        console.log(`✅ Found ${tools.length} tools:`);
        tools.forEach(tool => {
          console.log(`  - ${tool.name}: ${tool.description}`);
        });
        
        // Check if OpenAI tools are available
        const openaiTools = tools.filter(tool => 
          tool.name.includes('openai') || 
          tool.name.includes('ai_feedback') || 
          tool.name.includes('ai_insights')
        );
        
        if (openaiTools.length === 0) {
          console.log('❌ No OpenAI tools found!');
          ws.close();
          resolve({ success: false, error: 'No OpenAI tools available' });
          return;
        }
        
        console.log(`✅ Found ${openaiTools.length} OpenAI tools:`);
        openaiTools.forEach(tool => {
          console.log(`  - ${tool.name}`);
        });
        
        // Test OpenAI connection
        if (tools.find(t => t.name === 'test_openai_connection')) {
          console.log('Testing OpenAI API connection...');
          const connectionTest = await sendRequest(ws, pendingRequests, {
            jsonrpc: '2.0',
            id: requestId++,
            method: 'tools/call',
            params: {
              name: 'test_openai_connection',
              arguments: {}
            }
          });
          
          console.log('OpenAI connection test result:', connectionTest);
          
          if (connectionTest && connectionTest.content) {
            const textContent = connectionTest.content.find(item => item.type === 'text');
            if (textContent) {
              const result = JSON.parse(textContent.text);
              if (result.success) {
                console.log('✅ OpenAI API connection successful!');
                console.log(`Available models: ${result.modelCount}`);
              } else {
                console.log('❌ OpenAI API connection failed:', result.error);
              }
            }
          }
        }
        
        // Test AI feedback tool
        if (tools.find(t => t.name === 'get_ai_feedback')) {
          console.log('Testing AI feedback tool...');
          const feedbackTest = await sendRequest(ws, pendingRequests, {
            jsonrpc: '2.0',
            id: requestId++,
            method: 'tools/call',
            params: {
              name: 'get_ai_feedback',
              arguments: {
                content: 'I am testing the AI feedback system. Please respond with exactly: "AI feedback system is working correctly!"',
                persona: 'You are a helpful AI assistant. Respond exactly as requested.',
                model: 'gpt-4o-mini'
              }
            }
          });
          
          console.log('AI feedback test result:', feedbackTest);
          
          if (feedbackTest && feedbackTest.content) {
            const textContent = feedbackTest.content.find(item => item.type === 'text');
            if (textContent) {
              const result = JSON.parse(textContent.text);
              console.log('✅ AI Feedback Response:', result.text || result);
            }
          }
        }
        
        ws.close();
        resolve({ success: true });
        
      } catch (error) {
        console.log('❌ Error during OPAL test:', error.message);
        ws.close();
        resolve({ success: false, error: error.message });
      }
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.id !== undefined && pendingRequests.has(message.id)) {
        const { resolve, reject } = pendingRequests.get(message.id);
        pendingRequests.delete(message.id);
        
        if (message.error) {
          reject(new Error(`${message.error.message} (Code: ${message.error.code})`));
        } else {
          resolve(message.result);
        }
      }
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
      resolve({ success: false, error: error.message });
    });
    
    ws.on('close', () => {
      console.log('Connection closed');
    });
  });
}

function sendRequest(ws, pendingRequests, request) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(request.id);
      reject(new Error(`Request timeout for method: ${request.method}`));
    }, 30000);
    
    pendingRequests.set(request.id, { 
      resolve: (result) => {
        clearTimeout(timeout);
        resolve(result);
      }, 
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    });
    
    ws.send(JSON.stringify(request));
  });
}

// Run the test
testOPALOpenAI().then((result) => {
  if (result.success) {
    console.log('🎉 OPAL OpenAI tools test completed successfully!');
  } else {
    console.log('❌ OPAL OpenAI tools test failed:', result.error);
  }
  process.exit(result.success ? 0 : 1);
}).catch((error) => {
  console.log('❌ Test failed with error:', error.message);
  process.exit(1);
});
