function openPopup(house, mode="info") {
    const latlng = JSON.parse(house.latlng);
    const html = renderPopup(house, mode);

    L.popup({maxWidth:1280})
        .setLatLng(latlng)
        .setContent(html)
        .openOn(map);
}
function renderPopup(house, mode) {
    return `
        <div class="popup-container" style="font-size:16px; line-height:1.4;">
            ${renderHeader(house)}
            ${renderTabs(house, mode)}
            <div style="margin-top:10px;">
                ${renderBody(house, mode)}
            </div>
        </div>
    `;
}
function renderHeader(house) {
    const label = house.num
        ? `${house.ch}-${house.num}号室`
        : `家番号 ${house.ch}`;

    return `
        <div style="font-weight:bold; font-size:18px; margin-bottom:8px;">
            ${label}
        </div>
    `;
}
function renderTabs(house, mode) {
    const tabs = [
        {id:"info",   label:"情報"},
        {id:"lang",   label:"言語"},
        {id:"remark", label:"備考"}
    ];

    return `
        <div style="margin-bottom:10px;">
            ${tabs.map(t => `
                <button
                    onclick="openPopup(house,'${t.id}')"
                    style="
                        padding:6px 10px;
                        margin-right:4px;
                        border-radius:4px;
                        border:1px solid #888;
                        background:${mode===t.id ? '#ddd' : '#f7f7f7'};
                    "
                >
                    ${t.label}
                </button>
            `).join("")}
        </div>
    `;
}
function renderInfoSection(house) {
    const items = ["拒否","手話","JW","空家","倉庫","欠番"];

    return `
        記録用紙：${house.recInfo}<br>
        区域情報：${house.info}<br><br>

        ${items.map(v => `
            <button onclick="updateInfo(house,'${v}')" style="margin:3px;">${v}</button>
        `).join("")}

        <button onclick="updateInfo(house,'')" style="margin:3px;">削除</button>
    `;
}
function renderLanguageSection(house) {
    const langs = ["英語","中国語","韓国語","ポル語","スペ語","ベト語","タガ語","その他"];

    return `
        記録用紙：${house.recLang}<br>
        区域情報：${house.language}<br><br>

        ${langs.map((l,i)=>`
            <button onclick="updateLang(house,${i+1})" style="margin:3px;">${l}</button>
        `).join("")}

        <button onclick="updateLang(house,0)" style="margin:3px;">削除</button>
    `;
}
function renderRemarkSection(house) {
    return `
        <textarea id="remark" style="width:95%; height:80px;">${house.recRemark}</textarea><br>
        <button onclick="saveRemark(house)" style="margin-top:6px;">保存</button>
    `;
}
function renderBody(house, mode) {
    switch(mode) {
        case "info":   return renderInfoSection(house);
        case "lang":   return renderLanguageSection(house);
        case "remark": return renderRemarkSection(house);
        default:       return renderInfoSection(house);
    }
}
function getIconType(house) {

    // 拒否（赤△） → CSS: diviconR
    if (house.info === "拒否" || house.recInfo === "拒否") {
        return "diviconR";
    }

    // 投函（黄色） → CSS に黄色がないので新規追加する必要あり
    if (house.rec && house.rec[0] === true && house.rec[1] === true) {
        return "diviconYellow";  // ★後で CSS を追加する
    }

    // 会えた（緑） → CSS: diviconG
    if (house.rec && house.rec[0] === true && house.rec[1] === false) {
        return "diviconG";
    }

    // 留守（青） → CSS: diviconB
    if (house.rec && house.rec[0] === false && house.rec[1] === true) {
        return "diviconB";
    }

    // 備考あり（オレンジ） → CSS: diviconO
    if (house.remark || house.recRemark) {
        return "diviconO";
    }

    // 差異あり（赤枠） → CSS: diviconOmit が赤文字黒丸だが、赤枠は diviconR で統一する？
    if (
        house.info !== house.recInfo ||
        house.language !== house.recLang ||
        house.remark !== house.recRemark
    ) {
        return "diviconR";  // ★あなたの仕様では赤枠＝diviconR
    }

    // 通常（黒） → CSS: diviconK
    return "diviconK";
}
function createMarker(house) {
    const latlng = JSON.parse(house.latlng);
    const iconType = getIconType(house);

    const icon = L.divIcon({
        html: `<div class="${iconType}">${house.num ? house.num : house.ch}</div>`,
        iconSize: [0,0],
        iconAnchor: [20,20]
    });

    const popupHtml = renderPopup(house, "info");

    const marker = L.marker(latlng, {icon}).bindPopup(popupHtml, {maxWidth:1200});
    markers.addLayer(marker);

    return marker;
}
function updateInfo(house, value) {
    house.info = value;
    house.recInfo = value;
    saveHouse(house);
}

function updateLang(house, index) {
    const langs = ["","英語","中国語","韓国語","ポル語","スペ語","ベト語","タガ語","その他"];
    house.language = langs[index];
    house.recLang = langs[index];
    saveHouse(house);
}

function saveRemark(house) {
    const v = document.getElementById("remark").value;
    house.remark = v;
    house.recRemark = v;
    saveHouse(house);
}
function saveHouse(house) {
    google.script.run.setSpreadsheetInfo(Number(view), house);

    // マーカー再生成
    const index = house.num ? building.findIndex(b => b.ch === house.ch) : house.ch;
    markers.removeLayer(markers1[index] || markers2[index]);

    const marker = createMarker(house);

    if (!house.num) markers1[index] = marker;
    else markers2[index] = marker;
}
