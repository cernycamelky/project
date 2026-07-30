// --- 1. ZÁKLADNÍ NASTAVENÍ A NAČTENÍ DAT ---
let templates = JSON.parse(localStorage.getItem('templates')) || [];
let currentUseId = null;

// Po načtení stránky se spustí tyto funkce
document.addEventListener('DOMContentLoaded', () => {
    renderList(); // Vykreslí seznam šablon
    document.getElementById('template-text').addEventListener('input', detectVariables); // Sleduje psaní textu
    checkTheme(); // Zkontroluje, zda měl uživatel zapnutý tmavý režim
});


// --- 2. TMAVÝ REŽIM (Dark mode) ---
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('theme-toggle');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        btn.innerText = '☀️ Světlý režim';
        btn.style.backgroundColor = '#f0f2f5';
        btn.style.color = '#333';
    } else {
        localStorage.setItem('theme', 'light');
        btn.innerText = '🌙 Tmavý režim';
        btn.style.backgroundColor = '#333';
        btn.style.color = 'white';
    }
}

function checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    const btn = document.getElementById('theme-toggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        // Musíme upravit i tlačítko, aby odpovídalo tmavému režimu
        if (btn) {
            btn.innerText = '☀️ Světlý režim';
            btn.style.backgroundColor = '#f0f2f5';
            btn.style.color = '#333';
        }
    }
}


// --- 3. DETEKCE A POJMENOVÁNÍ PROMĚNNÝCH ---
function detectVariables() {
    const text = document.getElementById('template-text').value;
    const regex = /\(V\.\d+\)/g; // Hledá (V.1), (V.2) atd.
    const matches = text.match(regex);
    const container = document.getElementById('variable-names-setup');
    
    // Zapamatujeme si text z políček, ať se při dalším psaní nesmaže
    const existingInputs = {};
    container.querySelectorAll('input').forEach(input => {
        existingInputs[input.dataset.var] = input.value;
    });

    container.innerHTML = ''; // Vyčistíme kontejner

    if (matches) {
        const uniqueVars = [...new Set(matches)]; // Odstraní duplikáty
        
        const infoText = document.createElement('p');
        infoText.style = "color: #1a73e8; font-size: 0.9em; margin-bottom: 5px; font-weight: bold;";
        infoText.innerText = "Pojmenujte své proměnné (nepovinné):";
        container.appendChild(infoText);

        uniqueVars.forEach(variable => {
            const div = document.createElement('div');
            div.className = 'var-input-group';
            
            const savedValue = existingInputs[variable] || '';
            
            div.innerHTML = `
                <label style="width: 70px;">${variable}</label>
                <input type="text" data-var="${variable}" class="var-name-input" placeholder="Např. Jméno, Datum..." value="${savedValue}">
            `;
            container.appendChild(div);
        });
    }
}


// --- 4. UKLÁDÁNÍ A ÚPRAVA ŠABLON ---
function saveTemplate() {
    const title = document.getElementById('template-title').value.trim();
    const text = document.getElementById('template-text').value.trim();
    const editId = document.getElementById('edit-id').value;

    if (!title || !text) {
        alert('Vyplňte prosím název i text šablony.');
        return;
    }

    // Uložení vlastních názvů proměnných
    const customVarNames = {};
    document.querySelectorAll('.var-name-input').forEach(input => {
        if (input.value.trim() !== '') {
            customVarNames[input.dataset.var] = input.value.trim();
        }
    });

    if (editId) {
        // Úprava existující šablony
        const index = templates.findIndex(t => t.id == editId);
        if (index !== -1) {
            templates[index].title = title;
            templates[index].text = text;
            templates[index].varNames = customVarNames;
        }
        cancelEdit();
    } else {
        // Vytvoření nové šablony
        const newTemplate = {
            id: Date.now(),
            title: title,
            text: text,
            varNames: customVarNames
        };
        templates.push(newTemplate);
    }

    localStorage.setItem('templates', JSON.stringify(templates));
    
    document.getElementById('template-title').value = '';
    document.getElementById('template-text').value = '';
    document.getElementById('variable-names-setup').innerHTML = ''; 
    
    renderList();
}

function cancelEdit() {
    document.getElementById('edit-id').value = '';
    document.getElementById('template-title').value = '';
    document.getElementById('template-text').value = '';
    document.getElementById('variable-names-setup').innerHTML = '';
    document.getElementById('save-btn').innerText = 'Uložit šablonu';
    document.getElementById('cancel-btn').style.display = 'none';
}


// --- 5. SEZNAM ULOŽENÝCH TEXTŮ ---
function renderList() {
    const list = document.getElementById('template-list');
    list.innerHTML = '';

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
    if(confirm('Opravdu chcete tuto šablonu smazat?')) {
        templates = templates.filter(t => t.id !== id);
        localStorage.setItem('templates', JSON.stringify(templates));
        renderList();
    }
}

function editTemplate(id) {
    const template = templates.find(t => t.id === id);
    if (template) {
        document.getElementById('template-title').value = template.title;
        document.getElementById('template-text').value = template.text;
        document.getElementById('edit-id').value = template.id;
        document.getElementById('save-btn').innerText = 'Uložit změny';
        document.getElementById('cancel-btn').style.display = 'inline-block';
        
        // Znovu vygenerujeme políčka pro úpravu proměnných
        setTimeout(() => {
            detectVariables();
            if (template.varNames) {
                document.querySelectorAll('.var-name-input').forEach(input => {
                    const varKey = input.dataset.var;
                    if (template.varNames[varKey]) {
                        input.value = template.varNames[varKey];
                    }
                });
            }
        }, 50);

        window.scrollTo(0, 0);
    }
}


// --- 6. POUŽITÍ ŠABLONY A GENEROVÁNÍ VÝSLEDKU ---
function useTemplate(id) {
    currentUseId = id;
    const template = templates.find(t => t.id === id);
    
    document.getElementById('use-section').style.display = 'block';
    document.getElementById('use-title').innerText = template.title;
    document.getElementById('result-text').value = '';
    
    const inputsContainer = document.getElementById('variable-inputs');
    inputsContainer.innerHTML = '';

    const regex = /\(V\.\d+\)/g;
    const matches = template.text.match(regex);

    if (matches) {
        const uniqueVars = [...new Set(matches)];
        
        uniqueVars.forEach(variable => {
            const div = document.createElement('div');
            div.className = 'var-input-group';
            
            // Pokud máme uložený vlastní název, použijeme ho
            let displayName = variable;
            if (template.varNames && template.varNames[variable]) {
                displayName = template.varNames[variable];
            }

            div.innerHTML = `
                <label style="width: 120px;">${displayName}</label>
                <input type="text" id="input-${variable}" placeholder="Zadejte text...">
            `;
            inputsContainer.appendChild(div);
        });
    } else {
        inputsContainer.innerHTML = '<p style="color: #666;">Tato šablona neobsahuje žádné proměnné. Zkopíruje se rovnou celý text.</p>';
    }
    
    document.getElementById('use-section').scrollIntoView({ behavior: 'smooth' });
}

function generateText() {
    const template = templates.find(t => t.id === currentUseId);
    if (!template) return;

    let finalText = template.text;
    const regex = /\(V\.\d+\)/g;
    const matches = template.text.match(regex);

    if (matches) {
        const uniqueVars = [...new Set(matches)];
        uniqueVars.forEach(variable => {
            const inputValue = document.getElementById(`input-${variable}`).value;
            // Nahradí všechny výskyty (V.X) za uživatelův text
            finalText = finalText.split(variable).join(inputValue);
        });
    }

    document.getElementById('result-text').value = finalText;
}

function copyResult() {
    const resultText = document.getElementById('result-text');
    if (!resultText.value) return;
    
    resultText.select();
    document.execCommand('copy');
    alert('Výsledek byl zkopírován do schránky!');
}
// --- 7. ZAVŘENÍ SEKCE VYPLŇOVÁNÍ ---
function closeUseSection() {
    document.getElementById('use-section').style.display = 'none';
}
