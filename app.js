const $=id=>document.getElementById(id),escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let records=[],result=Chimney.analyze([]),selected=null,selectedBay=null,selectedRow=null,loaded=false;
function renderBlocks(){
 for(const [id,blocks] of [['rtg',Chimney.RTG],['tp',Chimney.TP]]){
 $(id).innerHTML=blocks.map(b=>{const count=records.filter(c=>c.block===b).length,n=result.issues.filter(s=>s.block===b).length;return `<button class="block ${count?'populated':''} ${n?'danger':''} ${b===selected?'selected':''}" data-block="${b}"><strong>${b}</strong><small>${n?n+' chimney':count?count+' cont':'Chưa có dữ liệu'}</small></button>`}).join('');
 $(id).querySelectorAll('button').forEach(el=>el.onclick=()=>chooseBlock(el.dataset.block));
 }$('rtgCount').textContent=Chimney.RTG.length+' block';
}
function chooseBlock(b,bay,row){selected=b;const bays=[...new Set(records.filter(c=>c.block===b).map(c=>c.bay))].sort((a,b)=>Number(a)-Number(b));selectedBay=bay||bays.find(y=>result.issues.some(s=>s.block===b&&s.bay===y))||bays[0];selectedRow=row||null;renderBlocks();$('selectedTitle').textContent='Block '+b;$('bay').innerHTML=bays.map(y=>`<option ${y===selectedBay?'selected':''}>${y}</option>`).join('');$('bay').disabled=!bays.length;renderDetail()}
function renderDetail(){
 const bays=[...new Set(records.filter(c=>c.block===selected).map(c=>c.bay))].sort((a,b)=>Number(a)-Number(b));
 $('detailNote').textContent=bays.length?'Chọn bay và row để xem container. Màu đỏ là stack chimney.':'Block này chưa có dữ liệu; chưa thể kết luận có chimney hay không.';
 $('baymap').innerHTML=bays.length?'<div class="sectionlabel">Các bay có dữ liệu</div><div class="baytiles">'+bays.map(y=>`<button class="${result.issues.some(s=>s.block===selected&&s.bay===y)?'danger':''} ${y===selectedBay?'active':''}" data-bay="${y}">${y}</button>`).join('')+'</div>':'';
 $('baymap').querySelectorAll('button').forEach(el=>el.onclick=()=>chooseBlock(selected,el.dataset.bay));
 if(!selectedBay){$('cross').innerHTML='';$('containerDetails').innerHTML='';return}
 const rows=Chimney.rowsFor(records,selected),max=Math.max(7,...rows.map(r=>result.height(selected,selectedBay,r)));
 $('cross').innerHTML=`<div class="sectionlabel">Sơ đồ bay ${selectedBay} · Chiều cao theo tier</div><div class="crossgrid">`+rows.map(r=>{const s=result.stacks.get([selected,selectedBay,r].join('|'));let cells='';for(let t=max;t>=1;t--){const c=s?.containers.find(c=>c.tier===t);cells+=`<div class="tier ${!c?'void':s.chimney?'chimney':''}" title="${escapeHTML(c?c.id+' · '+c.position:'Không có container tại tier '+t)}">${c?t:'·'}</div>`}return '<div class="stackcol">'+cells+'</div>'}).join('')+'</div><div class="rowlabels">'+rows.map(r=>`<button data-row="${r}" class="${result.stacks.get([selected,selectedBay,r].join('|'))?.chimney?'danger':''} ${r===selectedRow?'active':''}">${r}</button>`).join('')+'</div>';
 $('cross').querySelectorAll('button').forEach(el=>el.onclick=()=>{selectedRow=el.dataset.row;renderDetail()});
 if(!selectedRow)selectedRow=result.issues.find(s=>s.block===selected&&s.bay===selectedBay)?.row||rows.find(r=>result.height(selected,selectedBay,r)>0);
 const s=result.stacks.get([selected,selectedBay,selectedRow].join('|'));
 $('containerDetails').innerHTML=s?`<div class="containerinfo"><strong>Row ${s.row} · ${s.chimney?'Chimney':'Không chimney'} · Tier ${s.height}</strong><p>Row trái: ${s.left===null?'Biên ngoài':'Tier '+s.left} · Row phải: ${s.right===null?'Biên ngoài':'Tier '+s.right}</p>`+s.containers.slice().sort((a,b)=>b.tier-a.tier).map(c=>`<p><strong>T${c.tier} · ${escapeHTML(c.id)}</strong><br>${escapeHTML(c.size)} · ${escapeHTML(c.status)} · ${escapeHTML(c.operator)} · ${escapeHTML(c.port)}</p>`).join('')+'</div>':'<div class="containerinfo">Row '+selectedRow+': không có dữ liệu container.</div>';
}
$('bay').onchange=()=>{selectedBay=$('bay').value;selectedRow=null;renderDetail()};
$('clear').onclick=()=>{
 $('source').value='';records=[];result=Chimney.analyze([]);selected=null;selectedBay=null;selectedRow=null;loaded=false;
 for(const id of ['total','issueCount','blockCount','errorCount'])$(id).textContent='—';
 $('notice').textContent='Đã xóa dữ liệu. Dán dữ liệu mới để kiểm tra.';
 $('validation').hidden=true;$('validation').open=false;$('errorTitle').textContent='';$('errors').innerHTML='';
 $('resultRows').innerHTML='';$('resultNote').textContent='Kết quả sẽ xuất hiện sau khi kiểm tra.';
 $('selectedTitle').textContent='Chọn block';$('detailNote').textContent='Bấm vào block để xem vị trí.';
 $('bay').innerHTML='';$('bay').disabled=true;
 for(const id of ['baymap','cross','containerDetails'])$(id).innerHTML='';
 renderBlocks();$('source').focus();
};
function run(demo=false){const parsed=Chimney.parse($('source').value);records=parsed.records;result=Chimney.analyze(records);loaded=true;
 $('total').textContent=records.length.toLocaleString('vi-VN');$('issueCount').textContent=result.issues.length;$('blockCount').textContent=new Set(result.issues.map(s=>s.block)).size;$('errorCount').textContent=parsed.errors.length;
 $('notice').textContent=(demo?'DỮ LIỆU MINH HỌA · ':'')+`${records.length} container hợp lệ; ${parsed.errors.length} dòng lỗi.`+(parsed.errors.length?' Kết quả tạm tính: cần sửa dòng lỗi và kiểm tra lại.':'');
 $('validation').hidden=!parsed.errors.length;$('errorTitle').textContent=parsed.errors.length+' dòng chưa được tính — bấm để xem';$('errors').innerHTML=parsed.errors.slice(0,150).map(e=>`<p>Dòng ${e.line}: ${escapeHTML(e.reason)}</p>`).join('');
 $('resultNote').textContent=(demo?'Dữ liệu minh họa. ':'')+(parsed.errors.length?'Kết quả tạm tính vì có dòng bị loại. ': '')+(records.length?(result.issues.length?result.issues.length+' vị trí. Chọn vị trí để xem sơ đồ.':'Không phát hiện chimney trong dữ liệu hợp lệ đã dán.'):'Chưa có container hợp lệ để kiểm tra.');
 $('resultRows').innerHTML=result.issues.map((s,i)=>`<tr><td><button data-issue="${i}">${s.block}</button></td><td>${s.bay}</td><td>${s.row}</td><td>${s.height}</td><td>${s.left===null?'Biên':s.left}</td><td>${s.right===null?'Biên':s.right}</td><td>${escapeHTML(s.containers.find(c=>c.tier===s.height)?.id||'')}</td></tr>`).join('');$('resultRows').querySelectorAll('button').forEach(el=>el.onclick=()=>{const s=result.issues[Number(el.dataset.issue)];chooseBlock(s.block,s.bay,s.row);$('selectedTitle').scrollIntoView({behavior:'smooth',block:'center'})});
 chooseBlock(result.issues[0]?.block||records[0]?.block||Chimney.RTG[0]);
}
$('run').onclick=()=>run();$('demo').onclick=()=>{let lines=['SIZE\tBLOCK\tCONTAINER NUMBER\tSTATUS\tUN DISCHARGE PORT\tLINE OPERATOR\tCURRENT POSITION'],id=1;for(const [b,y,heights] of [['1C','01',[1,4,1,2,2,2,1,1]],['1C','03',[3,1,2,2,2,2,1,4]],['1D','01',[2,2,2,2,2,2,2,2]],['2N','05',[1,1,4,1,1,2,2,2]],['1A','01',[1,1,1,1,3,1,1,1]]])heights.forEach((h,r)=>{for(let t=1;t<=h;t++)lines.push(['20',b,'DEMO'+String(id++).padStart(7,'0'),'FULL','VNSGN','DEMO',`${b} ${y} ${String.fromCharCode(65+r)} ${t}`].join('\t'))});$('source').value=lines.join('\n');run(true)};renderBlocks();
