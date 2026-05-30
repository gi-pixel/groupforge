// DOM Elements
let currentHeaders = [];
let currentRows = [];
let selectedColumns = [];
let currentMode = 'single';
let duplicateColumns = [];
let pendingDuplicateResolve = null;
let pendingShuffleResolve = null;
let pendingDuplicateData = null;
let pendingResolveCallback = null; 
let cleanedMembers = [];


const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const fileStatus = document.getElementById('fileStatus');
const dataCard = document.getElementById('dataCard');
const configCard = document.getElementById('configCard');
const columnsGrid = document.getElementById('columnsGrid');
const previewTable = document.getElementById('previewTable');
const recordCount = document.getElementById('recordCount');
const generateBtn = document.getElementById('generateBtn');
const singleMode = document.getElementById('singleMode');
const singleGroupSizeInput = document.getElementById('singleGroupSize');
const multipleMode = document.getElementById('multipleMode');
const statsBar = document.getElementById('statsBar');
const totalMembersSpan = document.getElementById('totalMembers');
const totalGroupsSpan = document.getElementById('totalGroups');
const singleStat = document.getElementById('singleStat');
const multipleStat = document.getElementById('multipleStat');
const numConfigsSpan = document.getElementById('numConfigs');
const toggleColumnsBtn = document.getElementById('toggleColumnsBtn');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuOverlay = document.getElementById('menuOverlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const liveGroupCount = document.getElementById('liveGroupCount');
const addSizeBtn = document.getElementById('addSizeBtn');


// Upload handlers
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--indigo-600)';
    uploadZone.style.background = 'var(--indigo-100)';
});
uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = 'var(--indigo-300)';
    uploadZone.style.background = 'var(--indigo-50)';
});
uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--indigo-300)';
    uploadZone.style.background = 'var(--indigo-50)';
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
});

if (singleGroupSizeInput) {
    singleGroupSizeInput.addEventListener('input', () => updateStats());
}


// Mode switching
document.querySelectorAll('.mode-option').forEach(btn => {
    btn.addEventListener('click', () => {
        currentMode = btn.dataset.mode;
        document.querySelectorAll('.mode-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (currentMode === 'single') {
            singleMode.style.display = 'block';
            multipleMode.style.display = 'none';
            singleStat.style.display = 'flex';
            multipleStat.style.display = 'none';
        } else {
            singleMode.style.display = 'none';
            multipleMode.style.display = 'block';
            singleStat.style.display = 'none';
            multipleStat.style.display = 'flex';
        }
        updateStats();
    });
});

window.addGroupSize = function() {
    const container = document.getElementById('groupSizesList');
    const newItem = document.createElement('div');
    newItem.className = 'config-item';
    newItem.innerHTML = `
        <div class="size-item">
            <input type="number" class="size-input" value="5" placeholder="Size">
            <button class="btn-icon remove-size" onclick="removeGroupSize(this)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
                </svg>
            </button>
        </div>
        <input type="text" class="sheet-name-input" placeholder="Sheet name (optional)" value="">
        <small class="sheet-hint">→ <span class="group-count-number">0</span> groups</small>
    `;
    container.appendChild(newItem);
    
    // Bind events to new inputs
    const newSizeInput = newItem.querySelector('.size-input');
    if (newSizeInput) {
        newSizeInput.addEventListener('input', () => {
            updateStats();
            updateConfigGroupCounts();
        });
    }
    
    const newSheetInput = newItem.querySelector('.sheet-name-input');
    if (newSheetInput) {
        newSheetInput.addEventListener('input', updateStats);
    }
    
    updateStats();
    updateConfigGroupCounts();
};

window.removeGroupSize = function(btn) {
    const configItem = btn.closest('.config-item');
    if (configItem) configItem.remove();
    updateStats();
};

document.getElementById('addSizeBtn')?.addEventListener('click', addGroupSize);

if (addSizeBtn) {
    addSizeBtn.addEventListener('click', addGroupSize);
}

if (singleGroupSizeInput) {
    singleGroupSizeInput.addEventListener('input', () => {
        updateStats();
        updateLiveGroupCount();
    });
}


function handleSizeInputChange() {
    updateStats();
    updateConfigGroupCounts();
}


function populateDuplicateColumns() {
    const container = document.getElementById('duplicateColumnsGrid');
    const settingsDiv = document.getElementById('duplicateSettings');
    
    if (!container || !currentHeaders.length) return;
    
    container.innerHTML = '';
    duplicateColumns = [];
    
    currentHeaders.forEach(header => {
        const div = document.createElement('div');
        div.className = 'duplicate-checkbox';
        div.innerHTML = `
            <input type="checkbox" class="duplicate-col-check" value="${header}" id="dup_${header}">
            <label for="dup_${header}">${header}</label>
        `;
        container.appendChild(div);
    });
    
    const firstCheckbox = container.querySelector('.duplicate-col-check');
    if (firstCheckbox) {
        firstCheckbox.checked = true;
        duplicateColumns = [firstCheckbox.value];
    }
    
    document.querySelectorAll('.duplicate-col-check').forEach(cb => {
        cb.addEventListener('change', () => {
            duplicateColumns = Array.from(document.querySelectorAll('.duplicate-col-check:checked'))
                .map(cb => cb.value);
        });
    });
    
    settingsDiv.style.display = 'block';
}



// File handling
function handleFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(extension)) {
        showAlert('Please upload CSV or Excel file', 'error');
        return;
    }

    fileStatus.innerHTML = `Loading: ${file.name}...`;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            if (extension === 'csv') {
                const text = e.target.result;
                const lines = text.split('\n');
                currentHeaders = lines[0].split(',').map(h => h.trim());
                currentRows = lines.slice(1).filter(line => line.trim()).map(line => {
                    const values = line.split(',');
                    const row = {};
                    currentHeaders.forEach((header, idx) => {
                        row[header] = values[idx] ? values[idx].trim() : '';
                    });
                    return row;
                });
            } else {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                if (jsonData.length > 0) {
                    currentHeaders = Object.keys(jsonData[0]);
                    currentRows = jsonData;
                }
            }
            
            fileStatus.innerHTML = `Loaded: ${file.name} (${currentRows.length} records)`;
            selectedColumns = [...currentHeaders];
            
            renderColumnSelector();
            // Add this line inside your handleFile() function after renderColumnSelector()
            populateDuplicateColumns();
            renderPreview();
            
            dataCard.style.display = 'block';
            configCard.style.display = 'block';
            updateStats();
            
        } catch (error) {
            fileStatus.innerHTML = `Error parsing file`;
            showAlert('Failed to parse file: ' + error.message, 'error');
        }
    };
    
    if (extension === 'csv') {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
}

function renderColumnSelector() {
    columnsGrid.innerHTML = '';
    
    currentHeaders.forEach(header => {
        const div = document.createElement('div');
        div.className = 'column-checkbox';
        div.innerHTML = `
            <input type="checkbox" class="column-check" value="${header}" checked>
            <span>${header}</span>
        `;
        columnsGrid.appendChild(div);
    });
    
    document.querySelectorAll('.column-check').forEach(cb => {
        cb.addEventListener('change', () => updateSelectedColumns());
    });
    
    let allSelected = true;
    toggleColumnsBtn.onclick = () => {
        const checks = document.querySelectorAll('.column-check');
        const someUnchecked = Array.from(checks).some(cb => !cb.checked);
        checks.forEach(cb => cb.checked = someUnchecked);
        updateSelectedColumns();
    };
}

function updateSelectedColumns() {
    selectedColumns = [];
    document.querySelectorAll('.column-check:checked').forEach(cb => {
        selectedColumns.push(cb.value);
    });
    renderPreview();
    updateStats();
}

function renderPreview() {
    if (!currentRows.length) return;
    
    recordCount.textContent = `${currentRows.length} total records`;
    
    let html = '<table><thead><tr>';
    selectedColumns.forEach(col => {
        html += `<th>${escapeHtml(col)}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    currentRows.slice(0, 10).forEach(row => {
        html += '<tr>';
        selectedColumns.forEach(col => {
            html += `<td>${escapeHtml(row[col] || '-')}</td>`;
        });
        html += '</tr>';
    });
    
    if (currentRows.length > 10) {
        html += `<tr><td colspan="${selectedColumns.length}" style="text-align: center; color: var(--gray-500);">... and ${currentRows.length - 10} more rows</td></tr>`;
    }
    
    html += '</tbody></table>';
    previewTable.innerHTML = html;
}

function updateStats() {
    if (!currentRows.length) return;
    
    totalMembersSpan.textContent = currentRows.length;
    statsBar.style.display = 'flex';
    
    if (currentMode === 'single') {
        const groupSize = parseInt(document.getElementById('singleGroupSize')?.value);
        if (!isNaN(groupSize) && groupSize > 0) {
            const numGroups = Math.ceil(currentRows.length / groupSize);
            totalGroupsSpan.textContent = numGroups;
            // Live update
            if (liveGroupCount) liveGroupCount.textContent = numGroups;
        } else {
            totalGroupsSpan.textContent = '?';
            if (liveGroupCount) liveGroupCount.textContent = '?';
        }
        singleStat.style.display = 'flex';
        multipleStat.style.display = 'none';
    } else {
        const configs = getGroupConfigs();
        numConfigsSpan.textContent = configs.length;
        singleStat.style.display = 'none';
        multipleStat.style.display = 'flex';
        // Update per-config counts
        updateConfigGroupCounts();
    }
}

function getGroupConfigs() {
    if (currentMode === 'single') {
        const size = parseInt(document.getElementById('singleGroupSize').value);
        return [{ size: size, sheetName: `Groups_of_${size}` }];
    } else {
        const configs = [];
        const items = document.querySelectorAll('.config-item');
        items.forEach((item, index) => {
            const sizeInput = item.querySelector('.size-input');
            const nameInput = item.querySelector('.sheet-name-input');
            const size = parseInt(sizeInput?.value);
            
            if (!isNaN(size) && size > 0) {
                let sheetName = nameInput?.value?.trim();
                if (!sheetName) {
                    sheetName = `Groups_of_${size}`;
                }
                // Excel sheet names max 31 chars, no special chars
                sheetName = sheetName.replace(/[\\/*?:\[\]]/g, '').substring(0, 31);
                configs.push({ size: size, sheetName: sheetName });
            }
        });
        return configs;
    }
}

function createGroups(members, groupSize) {
    const groups = [];
    for (let i = 0; i < members.length; i += groupSize) {
        groups.push(members.slice(i, i + groupSize));
    }
    return groups;
}

function formatSheetData(groups, selectedCols) {
    const sheetData = [];
    
    groups.forEach((group, idx) => {
        sheetData.push([`GROUP ${idx + 1} (${group.length} members)`, ...new Array(selectedCols.length - 1).fill('')]);
        sheetData.push(selectedCols);
        group.forEach(member => {
            const row = selectedCols.map(col => member[col] || '');
            sheetData.push(row);
        });
        sheetData.push([]);
    });
    
    return sheetData;
}

function bindSizeInputEvents() {
    document.querySelectorAll('.size-input').forEach(input => {
        input.removeEventListener('input', updateStats);
        input.addEventListener('input', updateStats);
    });
}


// ========== DETECT DUPLICATES IN ORIGINAL LIST (BY ROW NUMBER) ==========
function detectDuplicatesInList(members) {
    const duplicates = [];
    const seen = new Map();
    
    for (let rowIdx = 0; rowIdx < members.length; rowIdx++) {
        const member = members[rowIdx];
        
        const keyParts = duplicateColumns.map(col => {
            let val = member[col] || '';
            return String(val).trim().toLowerCase();
        });
        const key = keyParts.join('|');
        
        if (seen.has(key)) {
            const existing = seen.get(key);
            if (!existing.duplicateGroup) {
                const newDuplicate = {
                    key: key,
                    displayName: keyParts.join(' | '),
                    occurrences: [
                        { rowIndex: existing.rowIndex, rowNumber: existing.rowIndex + 1, member: existing.member },
                        { rowIndex: rowIdx, rowNumber: rowIdx + 1, member: member }
                    ]
                };
                duplicates.push(newDuplicate);
                existing.duplicateGroup = newDuplicate;
            } else {
                existing.duplicateGroup.occurrences.push({ rowIndex: rowIdx, rowNumber: rowIdx + 1, member: member });
            }
        } else {
            seen.set(key, { rowIndex: rowIdx, member: member, duplicateGroup: null });
        }
    }
    
    return duplicates;
}

// ========== SHOW DUPLICATE MODAL ==========
// ========== SHOW DUPLICATE MODAL ==========
function showDuplicateModal(duplicates) {
    return new Promise((resolve) => {
        const modal = document.getElementById('duplicateModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody || duplicates.length === 0) {
            resolve(null);
            return;
        }
        
        let html = '';
        
        duplicates.forEach((dup, idx) => {
            html += `
                <div class="duplicate-group" data-dup-index="${idx}">
                    <div class="duplicate-title">
                        ⚠️ Duplicate: ${escapeHtml(dup.displayName)}
                    </div>
                    <div class="select-all-row">
                        <input type="checkbox" class="select-all-dup" data-dup="${idx}" id="selectAll_${idx}">
                        <label for="selectAll_${idx}"><strong>Select / Deselect All</strong></label>
                    </div>
                    <div class="duplicate-options">
            `;
            
            dup.occurrences.forEach((occ, occIdx) => {
                const details = duplicateColumns.map(col => `${col}: ${occ.member[col] || '-'}`).join(' | ');
                html += `
                    <div class="duplicate-option">
                        <input type="checkbox" class="dup-checkbox" data-dup="${idx}" data-occ="${occIdx}" checked>
                        <label><strong>Row ${occ.rowNumber}</strong> - ${escapeHtml(details)}</label>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        modalBody.innerHTML = html;
        modal.classList.add('active');
        
        document.querySelectorAll('.select-all-dup').forEach(btn => {
            btn.addEventListener('change', (e) => {
                const dupIdx = e.target.getAttribute('data-dup');
                const checkboxes = document.querySelectorAll(`.dup-checkbox[data-dup="${dupIdx}"]`);
                checkboxes.forEach(cb => cb.checked = e.target.checked);
            });
        });

        pendingDuplicateData = duplicates;
        
         pendingResolveCallback = resolve;
    });
}


// ========== PROCESS DUPLICATE SELECTION ==========
function processDuplicateSelection() {
    const modal = document.getElementById('duplicateModal');
    if (!modal || !pendingDuplicateData) return;
    
    const toKeep = [];
    
    pendingDuplicateData.forEach((dup, dupIdx) => {
        const checkboxes = document.querySelectorAll(`.dup-checkbox[data-dup="${dupIdx}"]`);
        const checkedIndices = [];
        checkboxes.forEach((cb, idx) => {
            if (cb.checked) checkedIndices.push(idx);
        });
        toKeep.push({ dupIdx, checkedIndices });
    });
    
    modal.classList.remove('active');
    
    if (pendingResolveCallback) {
        pendingResolveCallback(toKeep);
    }
    
    pendingDuplicateData = null;
    pendingResolveCallback = null;
}




// ========== REMOVE UNCHECKED DUPLICATES FROM MEMBERS ==========
function removeUncheckedDuplicatesFromMembers(members, toKeep, duplicates) {
    const rowsToRemove = new Set();
    
    toKeep.forEach(item => {
        const duplicate = duplicates[item.dupIdx];
        for (let i = 0; i < duplicate.occurrences.length; i++) {
            if (!item.checkedIndices.includes(i)) {
                rowsToRemove.add(duplicate.occurrences[i].rowIndex);
            }
        }
    });
    
    const sortedRowsToRemove = Array.from(rowsToRemove).sort((a, b) => b - a);
    const cleanedMembers = [...members];
    
    for (const rowIdx of sortedRowsToRemove) {
        cleanedMembers.splice(rowIdx, 1);
    }
    
    return cleanedMembers;
}

// ========== UPDATE PREVIEW AFTER CLEANING ==========
function updatePreviewAfterCleaning(cleanedMembers) {
    currentRows = cleanedMembers;
    renderPreview();
    updateStats();
    showAlert(`Cleaned data: ${cleanedMembers.length} members remaining`, 'success');
}

function showShuffleModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('shuffleModal');
        if (!modal) {
            resolve(false);
            return;
        }
        
        modal.classList.add('active');
        
        const handleYes = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(true);
        };
        
        const handleNo = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(false);
        };
        
        const cleanup = () => {
            document.getElementById('shuffleYesBtn')?.removeEventListener('click', handleYes);
            document.getElementById('shuffleNoBtn')?.removeEventListener('click', handleNo);
        };
        
        document.getElementById('shuffleYesBtn')?.addEventListener('click', handleYes, { once: true });
        document.getElementById('shuffleNoBtn')?.addEventListener('click', handleNo, { once: true });
    });
}

document.getElementById('closeModalBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('duplicateModal');
    if (modal) modal.classList.remove('active');
    if (pendingResolveCallback) pendingResolveCallback(null);
    pendingDuplicateData = null;
    pendingResolveCallback = null;
});

document.getElementById('cancelModalBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('duplicateModal');
    if (modal) modal.classList.remove('active');
    if (pendingResolveCallback) pendingResolveCallback(null);
    pendingDuplicateData = null;
    pendingResolveCallback = null;
});

document.getElementById('confirmDuplicateBtn')?.addEventListener('click', processDuplicateSelection);


// ========== GENERATE BUTTON ==========
generateBtn.addEventListener('click', async () => {
    if (!currentRows.length) {
        showAlert('No data loaded', 'error');
        return;
    }
    
    if (selectedColumns.length === 0) {
        showAlert('Please select at least one column', 'error');
        return;
    }
    
    const configs = getGroupConfigs();
    if (configs.length === 0) {
        showAlert('Please add at least one valid group configuration', 'error');
        return;
    }
    
    // Step 1: Start with original members
    let workingMembers = currentRows.map(row => {
        const newRow = {};
        selectedColumns.forEach(col => {
            newRow[col] = row[col];
        });
        return newRow;
    });
    
    // Step 2: Check for duplicates if columns are selected
    if (duplicateColumns.length > 0) {
        const duplicates = detectDuplicatesInList(workingMembers);
        
        if (duplicates.length > 0) {
            pendingDuplicateData = duplicates;
            const toKeep = await showDuplicateModal(duplicates);
            
            if (toKeep && toKeep.length > 0) {
                workingMembers = removeUncheckedDuplicatesFromMembers(workingMembers, toKeep, duplicates);
                updatePreviewAfterCleaning(workingMembers);
                
                let removedCount = 0;
                duplicates.forEach((dup, idx) => {
                    const kept = toKeep.find(t => t.dupIdx === idx);
                    if (kept) {
                        removedCount += dup.occurrences.length - kept.checkedIndices.length;
                    } else {
                        removedCount += dup.occurrences.length;
                    }
                });
                showAlert(`Removed ${removedCount} duplicate entr${removedCount === 1 ? 'y' : 'ies'}`, 'success');
            } else {
                showAlert('Duplicate resolution cancelled. Generation aborted.', 'error');
                return;
            }
        }
    }
    
    // Step 3: Ask for shuffle
    const shouldShuffle = await showShuffleModal();
    if (shouldShuffle) {
        for (let i = workingMembers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [workingMembers[i], workingMembers[j]] = [workingMembers[j], workingMembers[i]];
        }
        showAlert('Member list shuffled', 'success');
        renderPreview();
    }
    
    // Step 4: Create workbook and export using workingMembers
    const workbook = XLSX.utils.book_new();
    
    if (currentMode === 'single') {
        const groups = createGroups(workingMembers, configs[0].size);
        const sheetData = formatSheetData(groups, selectedColumns);
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, configs[0].sheetName);
    } else {
        configs.forEach(config => {
            const groups = createGroups(workingMembers, config.size);
            const sheetData = formatSheetData(groups, selectedColumns);
            const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);
        });
    }
    
    const fileName = `groupforge_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    showAlert(`✅ File downloaded: ${fileName}`, 'success');
});

function escapeHtml(str) {
    if (!str) return '-';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

// Mobile Menu Functions
function openMenu() {
    if (mobileMenu) mobileMenu.classList.add('open');
    if (menuOverlay) menuOverlay.classList.add('active');
    if (hamburgerBtn) hamburgerBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (menuOverlay) menuOverlay.classList.remove('active');
    if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    document.body.style.overflow = '';
}

// Mobile Menu Event Listeners
if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

// Close menu when clicking mobile nav links
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
});


function bindAllConfigEvents() {
    document.querySelectorAll('.size-input').forEach(input => {
        input.removeEventListener('input', updateStats);
        input.addEventListener('input', updateStats);
    });
    document.querySelectorAll('.sheet-name-input').forEach(input => {
        input.removeEventListener('input', updateStats);
        input.addEventListener('input', updateStats);
    });
}

function updateLiveGroupCount() {
    if (!currentRows.length) return;
    
    const groupSize = parseInt(document.getElementById('singleGroupSize')?.value);
    const liveCountSpan = document.getElementById('liveGroupCount');
    
    if (groupSize && !isNaN(groupSize) && groupSize > 0 && liveCountSpan) {
        const numGroups = Math.ceil(currentRows.length / groupSize);
        liveCountSpan.textContent = numGroups;
    }
}

function updateConfigGroupCounts() {
    if (!currentRows.length) return;
    
    const configItems = document.querySelectorAll('.config-item');
    configItems.forEach(item => {
        const sizeInput = item.querySelector('.size-input');
        const countSpan = item.querySelector('.group-count-number');
        
        if (sizeInput && countSpan) {
            const size = parseInt(sizeInput.value);
            if (!isNaN(size) && size > 0) {
                const numGroups = Math.ceil(currentRows.length / size);
                countSpan.textContent = numGroups;
            } else {
                countSpan.textContent = '0';
            }
        }
    });
}