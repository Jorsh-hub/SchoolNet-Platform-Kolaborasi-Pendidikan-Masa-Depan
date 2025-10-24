function showTime() {
    const now = new Date();

    const wibTime = now.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });


    document.getElementById('currentTime').innerHTML = wibTime;
}


showTime(); 


setInterval(function () {
    showTime();
}, 1000);