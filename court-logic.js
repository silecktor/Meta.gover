// 1. Рендер состава судебного департамента (Динамически из judicial_data.js)
function renderCourtStaff() {
    const container = document.getElementById('judges-container');
    if (typeof judicialData !== 'undefined' && container) {
        // Объединяем всех судей в один список
        const allJudges = [
            ...judicialData.judges.supreme,
            ...judicialData.judges.federal,
            ...judicialData.judges.city
        ];

        container.innerHTML = allJudges.map(j => `
            <div class="official-card animate-fade" style="border-color: #a855f7;">
                <img src="${j.photo}" class="card-photo" onerror="this.src='images/default.jpg'">
                <div class="card-info">
                    <h4>${j.name}</h4>
                    <p class="post">${j.post}</p>
                    <p class="id-tag">UID: ${j.id}</p>
                </div>
            </div>
        `).join('');
    }
}

// 2. Поиск по реестру (Исправленная логика столбцов и кэша)
async function searchInRegistry() {
    const gid = document.getElementById('search-month').value;
    const caseNumInput = document.getElementById('case-number').value.trim();
    const btn = document.querySelector('.btn-court-search');

    if (!caseNumInput) return alert("Введите номер иска");

    btn.innerText = "СИНХРОНИЗАЦИЯ...";

    // Добавляем timestamp, чтобы Google не отдавал старую версию файла (кэш)
    const url = `https://docs.google.com/spreadsheets/d/1aQ_eAHyhdrTsH_UWyN1Mrj9l8_vEnvab8-lANx-L66k/gviz/tq?tqx=out:csv&gid=${gid}&t=${Date.now()}`;

    try {
        const response = await fetch(url, { cache: "no-store" });
        const text = await response.text();
        
        // Разбиваем CSV. Учитываем, что ячейки могут быть в кавычках.
        const rows = text.split('\n').map(row => 
            row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim())
        );

        // ВАШИ СТОЛБЦЫ: B=1 (№), C=2 (Ссылка), D=3 (Инстанция), E=4 (Судья), F=5 (Статус)
        const found = rows.find(row => {
            if (!row[1]) return false;
            // Сравниваем только цифры (убираем #, №, пробелы)
            return row[1].replace(/\D/g, '') === caseNumInput.replace(/\D/g, '');
        });

        if (found) {
            showCourtModal(found);
        } else {
            alert(`Иск №${caseNumInput} не найден в реестре.`);
        }
    } catch (e) {
        alert("Ошибка доступа к MetaCore.");
        console.error(e);
    } finally {
        btn.innerText = "ПРОВЕРИТЬ СТАТУС";
    }
}

function showCourtModal(data) {
    const modal = document.getElementById('resultModal');
    const body = document.getElementById('modalBody');

    // Извлекаем ссылку из столбца C (data[2])
    // Если там формула =HYPERLINK("url", "label"), вытаскиваем то, что в первых кавычках
    let rawCellContent = data[2] || "";
    let finalUrl = "#";

    if (rawCellContent.includes("http")) {
        // Регулярное выражение ищет любую строку, похожую на URL
        const urlMatch = rawCellContent.match(/https?:\/\/[^\s"']+/g);
        if (urlMatch) {
            finalUrl = urlMatch[0].replace(/[)]+$/, ''); // Убираем закрывающую скобку формулы, если она попала
        }
    }

    body.innerHTML = `
        <div class="modal-protocol-header">
            <div class="protocol-id">ПРОТОКОЛ МИНИСТЕРСТВА ЮСТИЦИИ</div>
            <h2 class="court-title-modal">${data[3] ? data[3].toUpperCase() : 'СУДЕБНЫЙ'} СУД</h2>
        </div>
        
        <div class="modal-grid-info">
            <div class="info-item">
                <span class="label">НОМЕР ДЕЛА:</span>
                <span class="value">#${data[1]}</span>
            </div>
            <div class="info-item">
                <span class="label">ОТВЕТСТВЕННЫЙ СУДЬЯ:</span>
                <span class="value">${data[4] || 'НАЗНАЧАЕТСЯ'}</span>
            </div>
            <div class="info-item status-block">
                <span class="label">ТЕКУЩИЙ СТАТУС:</span>
                <span class="status-text">${(data[5] || 'В ОБРАБОТКЕ').toUpperCase()}</span>
            </div>
        </div>

        <div class="modal-actions">
            <a href="${finalUrl}" target="_blank" class="btn-case-link">
                ОТКРЫТЬ МАТЕРИАЛЫ ДЕЛА
            </a>
        </div>
    `;
    modal.style.display = 'flex';
}
function closeModal() {
    document.getElementById('resultModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', renderCourtStaff);