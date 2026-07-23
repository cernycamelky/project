// 1. NAČTENÍ DAT
// Zkusíme najít uložené šablony v paměti prohlížeče (localStorage). 
// Pokud tam nic není, vytvoříme prázdné pole [].
let templates = JSON.parse(localStorage.getItem('templates')) || [];
let currentUseId = null; // Zde si budeme pamatovat, jakou šablonu zrovna vyplňujeme

// Po načtení stránky hned vykreslíme seznam šablon
document.addEventListener('DOMContentLoaded', renderList);

// 2. ULOŽENÍ NEBO ÚPRAVA ŠABLONY
function saveTemplate() {
    const title = document.getElementById('template-title').value.trim();
    const text = document.getElementById('template-text').value.trim();
    const editId = document.getElementById('edit-id').value;

    // Kontrola, jestli uživatel nezadal prázdná pole
    if (!title || !text) {
        alert('Vyplňte prosím název i text šablony.');
        return;
    }

    if (editId) {
        // Pokud editId existuje, znamená to, že UPRAVUJEME starou šablonu
        const index = templates.findIndex(t => t.id == editId);
        if (index !== -1) {
            templates[index].title = title;
            templates[index].text = text;
        }
        cancelEdit(); // Vyčistíme formulář
    } else {
        // Vytváříme NOVOU šablonu
        const newTemplate = {
            id: Date.now(), // Unikátní ID vygenerované podle aktuálního času v milisekundách
            title: title,
            text: text
        };
        templates.push(newTemplate); // Přidáme do pole
    }

    // Uložíme aktualizované pole zpět do paměti prohlížeče
    localStorage.setItem('templates', JSON.stringify(templates));
    
    // Vymažeme políčka
    document.getElementById('template-title').value = '';
    document.getElementById('template-text').value = '';
    
    // Překreslíme seznam, aby se tam nová šablona objevila
    renderList();
}

function cancelEdit() {
    document.getElementById('edit-id').value = '';
    document.getElementById('template-title').value = '';
    document.getElementById('template-text').value = '';
    document.getElementById('save-btn').innerText = 'Uložit šablonu';
    document.getElementById('cancel-btn').style.display = 'none';
}

// 3. VYKRESLENÍ SEZNAMU ULOŽENÝCH TEXTŮ
function renderList() {
    const list = document.getElementById('template-list');
    list.innerHTML = ''; // Vyprázdníme starý seznam

    // Projdeme všechny uložené šablony a vytvoříme pro ně HTML kód (položky li)
    templates.forEach(template => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${template.title}</strong>
            <div class="actions">
                <button class="btn-use" onclick="useTemplate(${template.id})">Použít</button>
                <button class="btn-edit" onclick="editTemplate(${template.id})">Upravit</button>
                <button class="btn-delete" onclick="deleteTemplate(${template.id})">Smazat</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function deleteTemplate(id) {
    // Okno pro potvrzení, ať se uživatel nepřeklikne
    if(confirm('Opravdu chcete tuto šablonu smazat?')) {
        // Vyfiltrujeme pole - ponecháme vše kromě toho, co mažeme
        templates = templates.filter(t => t.id !== id);
        localStorage.setItem('templates', JSON.stringify(templates));
        renderList();
    }
}

function editTemplate(id) {
    const template = templates.find(t => t.id === id);
    if (template) {
        // Natáhneme data zpět do horních políček pro úpravu
        document.getElementById('template-title').value = template.title;
        document.getElementById('template-text').value = template.text;
        document.getElementById('edit-id').value = template.id;
        document.getElementById('save-btn').innerText = 'Uložit změny';
        document.getElementById('cancel-btn').style.display = 'inline-block';
        window.scrollTo(0, 0); // Posuneme obrazovku úplně nahoru
    }
}

// 4. POUŽITÍ ŠABLONY A HLEDÁNÍ PROMĚNNÝCH
function useTemplate(id) {
    currentUseId = id;
    const template = templates.find(t => t.id === id);
    
    document.getElementById('use-section').style.display = 'block';
    document.getElementById('use-title').innerText = template.title;
    document.getElementById('result-text').value = '';
    
    const inputsContainer = document.getElementById('variable-inputs');
    inputsContainer.innerHTML = ''; // Vyčistit stará políčka

    // REGULÁRNÍ VÝRAZ (Regex): Hledá text v přesném formátu "(V." + číslo + ")"
    // /g na konci znamená, že hledá všechny výskyty v textu, ne jen první
    const regex = /\(V\.\d+\)/g;
    const matches = template.text.match(regex);

    if (matches) {
        // Může se stát, že se v textu (V.1) opakuje třikrát. Nechceme 3 políčka pro to samé.
        // Následující kód vyfiltruje pouze unikátní hodnoty (odstraní duplikáty)
        const uniqueVars = [...new Set(matches)];
        
        // Pro každou unikátní proměnnou vytvoříme jedno textové pole
        uniqueVars.forEach(variable => {
            const div = document.createElement('div');
            div.className = 'var-input-group';
            div.innerHTML = `
                <label>${variable}</label>
                <input type="text" id="input-${variable}" placeholder="Zadejte doplňovaný text...">
            `;
            inputsContainer.appendChild(div);
        });
    } else {
        inputsContainer.innerHTML = '<p style="color: #666;">Tato šablona neobsahuje žádné proměnné (např. (V.1)). Zkopíruje se rovnou celý text.</p>';
    }
    
    // Sjedeme na stránce kousek níže, k sekci vyplňování
    document.getElementById('use-section').scrollIntoView({ behavior: 'smooth' });
}

// 5. GENEROVÁNÍ HOTOVÉHO TEXTU
function generateText() {
    const template = templates.find(t => t.id === currentUseId);
    if (!template) return;

    let finalText = template.text;
    const regex = /\(V\.\d+\)/g;
    const matches = template.text.match(regex);

    if (matches) {
        const uniqueVars = [...new Set(matches)];
        uniqueVars.forEach(variable => {
            // Zjistíme, co uživatel napsal do vygenerovaného políčka
            const inputValue = document.getElementById(`input-${variable}`).value;
            
            // Nahradíme VŠECHNY výskyty dané proměnné (např. (V.1)) v textu za to, co uživatel zadal.
            // Split a Join je snadný trik, jak nahradit všechno najednou bez složitých funkcí.
            finalText = finalText.split(variable).join(inputValue);
        });
    }

    document.getElementById('result-text').value = finalText;
}

// 6. KOPÍROVÁNÍ VÝSLEDKU
function copyResult() {
    const resultText = document.getElementById('result-text');
    if (!resultText.value) return; // Pokud je pole prázdné, nedělej nic
    
    resultText.select();
    document.execCommand('copy'); // Zkopíruje vybraný text do schránky (Ctrl+C)
    alert('Výsledek byl zkopírován do schránky!');
}
