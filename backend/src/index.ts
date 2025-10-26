import 'dotenv/config';
import { createApp } from './app';
import { serverConfig } from './config';

const app = createApp({ debug: serverConfig.env === 'development' });

app.listen(serverConfig.port, () => {
  console.log('🚀 AlgoMentor Backend Started');
  console.log(`📍 Environment: ${serverConfig.env}`);
  console.log(`🌐 Server: http://localhost:${serverConfig.port}`);
  console.log(`❤️  Health: http://localhost:${serverConfig.port}/health`);
  console.log(`📊 API: http://localhost:${serverConfig.port}/api`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/patterns');
  console.log('  GET  /api/patterns/:id');
  console.log('  POST /api/ai/identify-pattern');
  console.log('  POST /api/ai/hint');
  console.log('  POST /api/submissions');
  console.log('  GET  /api/progress');
  console.log('');
});
