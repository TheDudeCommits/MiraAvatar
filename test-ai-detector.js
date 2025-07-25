import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test the Python AI detector directly
function testPythonDetector(text) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'server', 'services', 'ai-detector.py');
    console.log('Testing Python script at:', pythonScript);
    
    const pythonProcess = spawn('python3', [pythonScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.dirname(pythonScript)
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdin.write(text);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log('Process closed with code:', code);
      console.log('Stdout:', output);
      console.log('Stderr:', errorOutput);
      
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (e) {
          reject(new Error('Failed to parse JSON: ' + e.message));
        }
      } else {
        reject(new Error('Python script failed with code ' + code));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Test cases
async function runTests() {
  const testCases = [
    "This comprehensive analysis demonstrates significant patterns in the data.",
    "lol this is so cool! i mean like, who would have thought this would work?",
    "Furthermore, it is important to note that the extensive research suggests considerable implications."
  ];

  for (const text of testCases) {
    try {
      console.log('\n=== Testing Text ===');
      console.log('Input:', text);
      const result = await testPythonDetector(text);
      console.log('Result:', result);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

runTests().catch(console.error);