const STORAGE_KEY = 'arifmetika-tela-db-v1';
const CATEGORIES = ['Первичный', 'Постоянный', 'Реабилитация', 'Спина', 'Шея', 'Спорт'];
let db = loadDb();
let selectedPatientId = null;
let editPatientId = null;
let activeFilter = 'all';

function loadDb() { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); return value && Array.isArray(value.patients) ? value : { version: 1, patients: [] }; } catch { return { version: 1, patients: [] }; } }
function saveDb() { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); document.querySelector('.save-state').classList.add('pulse'); setTimeout(() => document.querySelector('.save-state').classList.remove('pulse'), 500); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(value) { return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function fullName(p) { return [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' '); }
function initials(p) { return ((p.firstName || '?')[0] + (p.lastName || '')[0]).toUpperCase(); }
function formatDate(value) { if (!value) return 'Не указана'; const [y,m,d] = value.split('-'); return `${d}.${m}.${y}`; }
function today() { return new Date().toISOString().slice(0,10); }
function currentMonth() { return new Date().toISOString().slice(0,7); }
function notify(text) { const toast = document.getElementById('toast'); toast.textContent = text; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); }

function route(name) { document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === name)); if (name === 'patients') renderPatients(); if (name === 'stats') renderStats(); }
document.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => route(button.dataset.route)));
document.getElementById('homeSearch').addEventListener('input', e => { document.getElementById('patientSearch').value = e.target.value; route('patients'); });

function filteredPatients() { const q = document.getElementById('patientSearch').value.trim().toLocaleLowerCase('ru'); return db.patients.filter(p => (activeFilter === 'all' || (p.categories || []).includes(activeFilter)) && (!q || [fullName(p), p.phone, p.secondPhone, ...(p.categories || [])].join(' ').toLocaleLowerCase('ru').includes(q))).sort((a,b) => fullName(a).localeCompare(fullName(b), 'ru')); }
function renderPatients() {
  const list = document.getElementById('patientList'); const patients = filteredPatients();
  list.innerHTML = patients.length ? patients.map(p => `<button class="patient-row ${p.id === selectedPatientId ? 'selected' : ''}" data-patient="${p.id}"><span class="avatar">${esc(initials(p))}</span><span><strong>${esc(fullName(p))}</strong><small>${esc((p.categories || []).join(' · ') || p.phone || 'Без категории')}</small></span><b>›</b></button>`).join('') : `<div class="list-empty"><strong>Ничего не найдено</strong><span>Попробуйте изменить поиск или добавьте пациента.</span></div>`;
  list.querySelectorAll('[data-patient]').forEach(b => b.addEventListener('click', () => { selectedPatientId = b.dataset.patient; renderPatients(); }));
  renderPatientDetail();
}
function renderPatientDetail() {
  const panel = document.getElementById('patientDetail'); const p = db.patients.find(item => item.id === selectedPatientId);
  if (!p) { panel.className = 'patient-detail glass empty-state'; panel.innerHTML = `<div><span class="empty-icon">♙</span><h2>Выберите пациента</h2><p>Или создайте первую карточку — достаточно указать имя.</p><button class="primary" id="emptyAdd">＋ Новый пациент</button></div>`; document.getElementById('emptyAdd').onclick = openPatientForm; return; }
  panel.className = 'patient-detail glass'; const visits = [...(p.visits || [])].sort((a,b) => b.date.localeCompare(a.date));
  panel.innerHTML = `<div class="patient-title"><span class="avatar large">${esc(initials(p))}</span><div><h2>${esc(fullName(p))}</h2><div class="tag-row">${(p.categories || []).map(c => `<span>${esc(c)}</span>`).join('')}</div></div><button class="secondary" id="editPatient">✎ Редактировать</button></div><div class="info-grid"><article class="info-card blue-info"><h3>Основные данные</h3><dl><div><dt>Телефон</dt><dd>${esc(p.phone || 'Не указан')}</dd></div><div><dt>Дата рождения</dt><dd>${formatDate(p.birthDate)}</dd></div></dl></article><article class="info-card green-info"><h3>Жалобы и состояние</h3><p>${esc(p.complaints || p.diagnosis || 'Информация пока не добавлена.')}</p></article><article class="info-card red-info"><h3>Важно</h3><p>${esc(p.warnings || 'Противопоказания и ограничения не указаны.')}</p></article></div><section class="history"><div class="card-title"><div><h3>История приёмов</h3><small>${visits.length} ${visits.length === 1 ? 'приём' : 'приёмов'}</small></div><button class="primary" id="addVisit">＋ Добавить приём</button></div><div class="visit-list">${visits.length ? visits.map(v => `<article class="visit-row"><time>${formatDate(v.date)}<small>${esc(v.type)}</small></time><div><strong>${esc(v.procedure)}</strong><p>${esc(v.result || v.recommendations || 'Без дополнительных заметок')}</p></div><div class="visit-price"><strong>${AppCalculations.currency(v.price)}</strong><small class="${v.paymentStatus}">${v.paymentStatus === 'paid' ? 'Оплачено' : v.paymentStatus === 'partial' ? 'Частично' : 'Не оплачено'}</small></div></article>`).join('') : `<div class="history-empty">Приёмов пока нет. Добавьте первый проведённый сеанс.</div>`}</div></section>`;
  document.getElementById('editPatient').onclick = () => openPatientForm(p.id); document.getElementById('addVisit').onclick = openVisitForm;
}
document.getElementById('patientSearch').addEventListener('input', renderPatients);
document.getElementById('filterChips').addEventListener('click', e => { if (!e.target.dataset.filter) return; activeFilter = e.target.dataset.filter; document.querySelectorAll('#filterChips .chip').forEach(c => c.classList.toggle('active', c === e.target)); renderPatients(); });

function buildCategoryPicker(selected=[]) { document.getElementById('categoryPicker').innerHTML = CATEGORIES.map(c => `<label class="category-option"><input type="checkbox" value="${c}" ${selected.includes(c) ? 'checked' : ''}><span>${c}</span></label>`).join(''); }
function openPatientForm(id=null) { editPatientId=id; const p=db.patients.find(x=>x.id===id); const form=document.getElementById('patientForm'); form.reset(); document.getElementById('patientFormMode').textContent=p?'Редактирование карточки':'Новая карточка'; if(p) Object.keys(p).forEach(k=>{if(form.elements[k] && typeof p[k]!=='object') form.elements[k].value=p[k]||'';}); buildCategoryPicker(p?.categories||[]); document.getElementById('patientDialog').showModal(); setTimeout(()=>form.elements.firstName.focus(),50); }
['addPatient','quickAdd'].forEach(id => document.getElementById(id).onclick = () => openPatientForm());
document.getElementById('patientForm').addEventListener('submit', e => { e.preventDefault(); const form=e.currentTarget; const data=Object.fromEntries(new FormData(form)); const categories=[...document.querySelectorAll('#categoryPicker input:checked')].map(x=>x.value); if(editPatientId){const current=db.patients.find(p=>p.id===editPatientId); Object.assign(current,data,{categories}); selectedPatientId=current.id;} else {const patient={...data,id:uid(),categories,visits:[],createdAt:new Date().toISOString()}; db.patients.push(patient); selectedPatientId=patient.id;} saveDb(); document.getElementById('patientDialog').close(); route('patients'); notify('Карточка пациента сохранена'); });

function openVisitForm() { const form=document.getElementById('visitForm'); form.reset(); form.elements.date.value=today(); form.elements.duration.value=60; form.elements.price.value=2000; form.elements.paidAmount.value=2000; const p=db.patients.find(x=>x.id===selectedPatientId); form.elements.type.value=(p?.visits?.length||0)?'Повторный':'Первичный'; document.getElementById('visitDialog').showModal(); }
document.getElementById('visitForm').addEventListener('submit', e => { e.preventDefault(); const data=Object.fromEntries(new FormData(e.currentTarget)); data.id=uid(); data.price=Number(data.price)||0; data.paidAmount=Number(data.paidAmount)||0; data.duration=Number(data.duration)||0; const p=db.patients.find(x=>x.id===selectedPatientId); p.visits=p.visits||[]; p.visits.push(data); saveDb(); document.getElementById('visitDialog').close(); renderPatients(); notify('Приём добавлен в историю'); });
document.querySelector('#visitForm [name="paymentStatus"]').addEventListener('change', e => { const f=e.target.form; if(e.target.value==='unpaid') f.elements.paidAmount.value=0; if(e.target.value==='paid') f.elements.paidAmount.value=f.elements.price.value; });
document.querySelector('#visitForm [name="price"]').addEventListener('input', e => { if(e.target.form.elements.paymentStatus.value==='paid') e.target.form.elements.paidAmount.value=e.target.value; });
document.querySelectorAll('[data-close]').forEach(b => b.onclick=()=>b.closest('dialog').close());

function renderStats() { const month=document.getElementById('statsMonth').value||currentMonth(); document.getElementById('statsMonth').value=month; const s=AppCalculations.monthStats(db.patients,month); document.getElementById('monthIncome').textContent=AppCalculations.currency(s.income); document.getElementById('monthVisits').textContent=s.visits.length; document.getElementById('visitBreakdown').textContent=`Первичных: ${s.primary} · Повторных: ${s.visits.length-s.primary}`; document.getElementById('averageCheck').textContent=AppCalculations.currency(Math.round(s.average)); document.getElementById('unpaidTotal').textContent=AppCalculations.currency(s.unpaid); document.getElementById('unpaidCount').textContent=`${s.unpaidCount} ${s.unpaidCount===1?'приём':'приёмов'}`; document.getElementById('statsRows').innerHTML=s.visits.length?s.visits.sort((a,b)=>b.date.localeCompare(a.date)).map(v=>`<div class="stat-row"><time>${formatDate(v.date)}</time><strong>${esc(v.patientName)}</strong><span>${esc(v.type)} · ${esc(v.procedure)}</span><b>${AppCalculations.currency(v.paidAmount)}</b></div>`).join(''):`<div class="history-empty">В выбранном месяце приёмов пока нет.</div>`; }
document.getElementById('statsMonth').addEventListener('change',renderStats);

function downloadDb(filename, payload=db) { const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }
document.getElementById('exportDb').onclick=()=>{downloadDb(`arifmetika-tela-${today()}.json`);notify('Резервная копия сохранена');};
document.getElementById('importDb').onclick=()=>document.getElementById('importFile').click();
document.getElementById('importFile').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const incoming=JSON.parse(reader.result);if(!incoming||!Array.isArray(incoming.patients))throw new Error();downloadDb(`arifmetika-tela-before-import-${today()}.json`);db=incoming;saveDb();selectedPatientId=null;route('patients');notify('База успешно загружена');}catch{notify('Не удалось прочитать файл базы');}};reader.readAsText(file);e.target.value='';});

renderPatients(); renderStats();
