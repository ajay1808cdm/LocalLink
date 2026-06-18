import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100, // 100 virtual users
  duration: '1m', // running continuously for 1 minute
  thresholds: {
    // 95% of requests must complete below 500ms
    http_req_duration: ['p(95)<500'], 
  },
};

export default function () {
  // Target URL - defaults to localhost if not provided in environment
  const target = __ENV.TARGET_URL || 'http://localhost:5000/api/health';
  
  const res = http.get(target);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time is fast': (r) => r.timings.duration < 1500, // slower than 1.5s is considered failing
  });
  
  // A small sleep to simulate realistic delay between requests from the same user
  sleep(0.1); 
}
