// Supabase 초기화
const SUPABASE_URL = 'https://pyrvtztsteuobziqfyvh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cnZ0enRzdGV1b2J6aXFmeXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMjU3OTUsImV4cCI6MjA3MTYwMTc5NX0.JRm4_NgsFQ6biAFclUSP7zchkefzKDnZiGe87fXHVNk';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Chart.js 초기화
const ctx = document.getElementById('hashChart').getContext('2d');
let hashChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: '처리 시간(ms)', data: [], backgroundColor: 'rgba(59,130,246,0.7)' }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
});

// 폼 제출 이벤트
document.getElementById('hashForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value || '익명';
    const password = document.getElementById('password').value;
    const algo = document.getElementById('algo').value;
    const cost = parseInt(document.getElementById('cost').value);

    let hashResult = '';
    let timeMs = 0;

    const start = performance.now();

    if (algo === 'bcrypt') {
        const salt = bcrypt.genSaltSync(cost);
        hashResult = bcrypt.hashSync(password, salt);
    } else if (algo === 'sha256') {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        hashResult = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
    }

    timeMs = performance.now() - start;

    // Supabase 테이블에 저장
    await supabase.from('password_results').insert([{ username, algo, hash: hashResult, time: timeMs }]);

    // 결과 표시
    document.getElementById('resultBox').textContent = 
        `사용자: ${username}\n알고리즘: ${algo}\n시간: ${timeMs.toFixed(2)} ms\n해시: ${hashResult}`;

    // 차트 업데이트
    hashChart.data.labels.push(username + ' ('+algo+')');
    hashChart.data.datasets[0].data.push(timeMs.toFixed(2));
    hashChart.update();
});

// Supabase 실시간 구독
supabase.from('password_results').on('INSERT', payload => {
    const data = payload.new;
    hashChart.data.labels.push(data.username + ' ('+data.algo+')');
    hashChart.data.datasets[0].data.push(data.time.toFixed(2));
    hashChart.update();
}).subscribe();
