function renderNews() {
    const container = document.getElementById('dynamic-news-container');
    
    // Проверяем, есть ли данные
    if (typeof newsData !== 'undefined' && container) {
        container.innerHTML = newsData.map(item => `
            <div class="news-item">
                <span class="news-date">${item.date}</span>
                <h4 style="color: #00f2ff; margin: 5px 0;">${item.title}</h4>
                <p style="font-size: 0.9rem; line-height: 1.4;">${item.text}</p>
            </div>
        `).join('');
    } else {
        container.innerHTML = "Ошибка: Данные не найдены.";
    }
}

// Запускаем отрисовку сразу
renderNews();