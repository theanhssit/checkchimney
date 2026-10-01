(function(root){
const RTG='0C 0D 0E 0F 0G 0H 0L 0M 0N 0P 0R 0S 0T 0U 0V 1C 1D 1E 1F 1G 1H 1J 1L 1M 1N 1P 1R 1S 1T 1U 1V 2N 2P 2R 2S 2T 2U 2V 3T 3U 5V 9S'.split(' ');
const TP='0A 0B 0K 0W 0Y 1A 1B 1K 1W 1X 1Y 1Z 2W 2Y 2Z 3W 3Z 4S 5S 7S 8S AA AS BG BR BS DA LC PW RS SA XX'.split(' ');
function parse(text){
 const records=[],errors=[],seen=new Set(),slots=new Set();
 text.replace(/^\uFEFF/,'').split(/\r?\n/).forEach((line,i)=>{
 if(!line.trim())return;
 const cells=line.split('\t').map(x=>x.trim().replace(/^"|"$/g,''));
 if(cells[0].toUpperCase()==='SIZE'&&cells[1]?.toUpperCase()==='BLOCK')return;
 const fail=reason=>errors.push({line:i+1,reason,raw:line});
 if(cells.length!==7)return fail('Cần đúng 7 cột, ngăn cách bằng Tab (copy trực tiếp từ Excel).');
 const [size,declared,id,status,port,operator,position]=cells;
 if(position.trim().startsWith('+'))return fail('Vị trí có dấu +: cần xác nhận ý nghĩa trên Spinnaker trước khi tính stack.');
 if(!position.trim()||/^(YARD|GATE)$/i.test(position.trim()))return fail('Chưa có vị trí stack cụ thể: '+(position.trim()||'trống')+'.');
 const match=position.toUpperCase().match(/^([A-Z0-9]{2})[ .\/-]+(\d{2})[ .\/-]+([A-Z]|\d{2})[ .\/-]+(\d{1,2})$/)||position.toUpperCase().match(/^([A-Z0-9]{2})[ .\/-]+(\d{2})[ .\/-]+([A-Z])(\d{1,2})$/);
 if(!match)return fail('Vị trí chưa hợp lệ. Ví dụ: 1C 01 A 1 hoặc 5S 38 67 1.');
 const [,block,bay,row,level]=match,tier=Number(level);
 if(![...RTG,...TP].includes(block))return fail('Block chưa có trong danh sách bãi: '+block);
 if(declared.toUpperCase()!==block)return fail('BLOCK khác block trong CURRENT POSITION.');
 if(!id)return fail('Thiếu container number.');
 if(tier<1||tier>9)return fail('Tier phải từ 1 đến 9.');
 if(Number(bay)<1)return fail('Bay phải lớn hơn 00.');
 if(seen.has(id.toUpperCase()))return fail('Trùng container number: '+id);
 const key=[block,bay,row,tier].join('|');
 if(slots.has(key))return fail('Hai container cùng vị trí: '+position);
 seen.add(id.toUpperCase());slots.add(key);records.push({size,block,id,status,port,operator,position,bay,row,tier});
 });
 return {records,errors};
}
function analyze(records){
 const stacks=new Map();
 for(const c of records){const k=[c.block,c.bay,c.row].join('|');let s=stacks.get(k);if(!s){s={block:c.block,bay:c.bay,row:c.row,height:0,containers:[]};stacks.set(k,s)}s.height=Math.max(s.height,c.tier);s.containers.push(c)}
 const height=(b,y,r)=>stacks.get([b,y,r].join('|'))?.height||0;
 const issues=[];
 for(const s of stacks.values()){
 const numeric=/^\d+$/.test(s.row),code=numeric?Number(s.row):s.row.charCodeAt(0);
 const neighbor=d=>numeric?String(code+d).padStart(2,'0'):String.fromCharCode(code+d);
 const legacy=RTG.includes(s.block);
 const left=(legacy&&s.row==='A')?null:height(s.block,s.bay,neighbor(-1)),right=(legacy&&s.row==='H')?null:height(s.block,s.bay,neighbor(1));
 s.left=left;s.right=right;s.chimney=s.height>=3&&(left===null||s.height-left>=2)&&(right===null||s.height-right>=2);
 if(s.chimney)issues.push(s);
 }
 issues.sort((a,b)=>a.block.localeCompare(b.block)||Number(a.bay)-Number(b.bay)||a.row.localeCompare(b.row));
 return {stacks,issues,height};
}
function rowsFor(records,block){const observed=[...new Set(records.filter(c=>c.block===block).map(c=>c.row))];if(RTG.includes(block)&&observed.every(r=>/^[A-H]$/.test(r)))return 'ABCDEFGH'.split('');const out=new Set();for(const r of observed){if(/^\d+$/.test(r)){const k=Number(r);for(let d=-1;d<=1;d++)if(k+d>=0)out.add(String(k+d).padStart(2,'0'));}else{const k=r.charCodeAt(0);for(let d=-1;d<=1;d++)if(k+d>=65&&k+d<=90)out.add(String.fromCharCode(k+d));}}return [...out].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));}
const api={RTG,TP,parse,analyze,rowsFor};if(typeof module!=='undefined')module.exports=api;else root.Chimney=api;
})(typeof window!=='undefined'?window:globalThis);
