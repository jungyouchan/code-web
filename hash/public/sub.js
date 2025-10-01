import * as argon2 from "argon2-browser";
import bcrypt from "bcryptjs";

function submit() {
  const form = document.getElementById("inputform");
  const Id = document.getElementById("inputId").value;
  const Pw = document.getElementById("inputPw").value;
  
  if (Pw === "") {
    alert("비밀번호를 모두 입력해주세요.");
    return false;
  }
  /* 함수 해싱 및 server로 전송*/
  (async () => {
    const result = await Promise.all([
      hashWithSHA256(Pw),
      hashWithArgon2(Pw),
      hashWithBcrypt(Pw)
    ])

    console.log("해싱 완", result)

    drawHashTimeChart(result[0].time_ms, result[1].time_ms, result[2].time_ms);

  })();

}


window.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("button");
  var doneTimeout = null,
  resetTimeout = null;

  if (btn) {
    btn.addEventListener("click", function () {
      submit();
      const runClass = "btn--running";
      const doneClass = "btn--done";
      // `.btn--running .btn__progress-fill` `stroke-dashoffset` duration in ms
      const submitDuration = 2000;
      const resetDuration = 1500;

      // fake the submission
      this.disabled = true;
      this.classList.add(runClass);

      clearTimeout(doneTimeout);
      clearTimeout(resetTimeout);

      doneTimeout = setTimeout(() => {
        this.classList.remove(runClass);
        this.classList.add(doneClass);
        
        // reset the button
        resetTimeout = setTimeout(() => {
          this.disabled = false;
          this.classList.remove(doneClass);
        }, resetDuration);

      }, 600 + submitDuration);
    });
  }
});
//# sourceURL=pen.js


async function hashWithSHA256(rawPassword) {
  const start = performance.now();

  // SHA-256 해싱
  const hash = crypto.createHash('sha256').update(rawPassword).digest('hex');

  const time_ms = performance.now() - start;

  return {
    hash,
    time_ms,
    algorithm: "SHA-256"
  };
}

async function hashWithArgon2(rawPassword, time=3, memKB=65536, parallelism=1) {
  const start = performance.now();
  const res = await argon2.hash({
    pass: rawPassword,
    time,
    mem: memKB,
    parallelism,
    wasmFile: "./argon2.wasm",
    type: argon2.ArgonType.Argon2id
  });
  const time_ms = performance.now() - start;
  return { hash: res.hashHex, time_ms, algorithm: "argon2", param: time, mem_kb: memKB, parallelism };
}

async function hashWithBcrypt(rawPassword, cost=12) {
  const start = performance.now();
  const salt = bcrypt.genSalt(cost); // 동기지만 빠름
  const hash = bcrypt.hash(rawPassword, salt);
  const time_ms = performance.now() - start;
  return { hash, time_ms, algorithm: "bcrypt", param: cost };
}


//해싱 함수 시간 결과 => 그래프 그리기
async function drawHashTimeChart(SHA256, Argon2, Bcrypt) {
  const ctx = document.getElementById('hashTimeChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['SHA-256', 'Argon2', 'Bcrypt'],
      datasets: [{
        label: '평균 해시 생성 시간 (ms)',
        data: [SHA256, Argon2, Bcrypt],
        backgroundColor: ['#4caf50', '#ff9800', '#2196f3']
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '시간 (ms)' }
        }
      }
    }
  });
}