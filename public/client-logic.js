// ui-renderer.js

// 1. 場所チップス
function renderLocationChips() {
    const locations = [...new Set(globalData.owners.map(o => o.location))];
    const container = document.getElementById('location-chips');
    container.innerHTML = locations.map(loc => 
        `<div class="btn-chip" onclick="selectLocation('${loc}')">${loc}</div>`
    ).join('');
}

// 2. カテゴリチップス
function selectLocation(loc) {
    selectedLoc = loc;
    const categories = [...new Set(globalData.owners.filter(o => o.location === loc).map(o => o.category))];
    const container = document.getElementById('category-chips');
    container.style.display = 'flex';
    container.innerHTML = categories.map(cat => `<div class="btn-chip" onclick="selectCategory('${cat}')">${cat}</div>`).join('');
    document.getElementById('service-list').style.display = 'none';
    document.getElementById('reservation-view').style.display = 'none';
}

// 3. サービス一覧カード
function selectCategory(cat) {
    const services = globalData.owners.filter(o => o.location === selectedLoc && o.category === cat);
    renderServiceList(services);
}

function renderServiceList(services) {
    const list = document.getElementById('service-items');
    document.getElementById('service-list').style.display = 'block';
    if (services.length === 0) {
        list.innerHTML = '<p style="font-size:0.8rem; color:#999; padding:20px;">見つかりませんでした。</p>';
        return;
    }
    list.innerHTML = services.map(s => `
        <div class="consult-card" style="border-left:4px solid var(--primary-color);">
            <div onclick="showReservation('${s.id}')" style="cursor:pointer;">
                <h3 style="margin:0; font-size:1rem;">${s.name}</h3>
                <p style="font-size:0.75rem; color:var(--text-sub); margin:2px 0;">${s.location} / ${s.category}</p>
                <p style="font-size:0.8rem; color:#666; margin:4px 0;">${s.description.substring(0,30)}...</p>
            </div>
            <a href="${s.url}" target="_blank" style="font-size:0.75rem; color:var(--primary-color); text-decoration:none;">🌐 公式サイト</a>
        </div>
    `).join('');
}

// 4. 予約詳細
function showReservation(id) {
    const owner = globalData.owners.find(o => o.id === id);
    const view = document.getElementById('reservation-view');
    view.style.display = 'block';
    
    let html = `<div class="reserve-card" style="background:#f0f7ff; padding:20px; border-radius:12px; border:1px solid #cce0ff;">
                <h2 style="font-size:1.1rem; margin-bottom:10px;">${owner.name}</h2>`;

    if (owner.staffs) {
        html += `<div class="chip-flex">` + owner.staffs.map(st => `<div class="btn-chip" onclick="renderStaffSlots('${id}', '${st.name}')">${st.name}</div>`).join('') + `</div><div id="slot-details"></div>`;
    } else {
        html += `<div id="slot-details">${generateSlotHtml(owner.schedules)}</div>`;
    }
    html += `<a href="${owner.url}" target="_blank" class="btn-exit">予約・詳細サイトへ</a></div>`;
    view.innerHTML = html;
    window.scrollTo({ top: view.offsetTop, behavior: 'smooth' });
}

function renderStaffSlots(ownerId, staffName) {
    const staff = globalData.owners.find(o => o.id === ownerId).staffs.find(s => s.name === staffName);
    document.getElementById('slot-details').innerHTML = generateSlotHtml(staff.schedules);
}

function generateSlotHtml(schedules) {
    return '<div class="slot-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">' + 
           schedules.map(sc => sc.slots.map(sl => `<div class="slot-item" style="background:#fff; padding:8px; border-radius:4px; font-size:0.7rem; border:1px solid #eee;">${sc.date}<br>${sl.time}</div>`).join('')).join('') + 
           '</div>';
}