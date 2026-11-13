/* Drawing history and on-chart quantity editing. No trades are undone. */
'use strict';
window.MicroBackTools=(()=>{
 const copy=value=>JSON.parse(JSON.stringify(value));
 const past=[],future=[];let dragBefore=null,quantityEdit=null,drawingPointer=null,lastPathTap=null,suppressDrawingClickUntil=0;
 const snapshot=()=>({drawings:copy(D),selection:D.indexOf(sel)});
 const same=(a,b)=>JSON.stringify(a.drawings)===JSON.stringify(b.drawings);
 const undoButton=document.createElement('button'),redoButton=document.createElement('button'),count=document.createElement('span');
 function toolButton(button,id,label,icon){button.id=id;button.type='button';button.title=label;button.setAttribute('aria-label',label);button.innerHTML='<svg viewBox="0 0 24 24">'+icon+'</svg><span class="tool-name">'+id.replace('drawing-','')+'</span>'}
 toolButton(undoButton,'drawing-undo','Undo drawing (Ctrl+Z)','<path d="m9 5-6 6 6 6M3 11h10a7 7 0 0 1 7 7"/>');
 toolButton(redoButton,'drawing-redo','Redo drawing (Ctrl+Shift+Z / Ctrl+Y)','<path d="m15 5 6 6-6 6m6-6H11a7 7 0 0 0-7 7"/>');
 $('#rail-toggle').after(undoButton,redoButton);count.id='drawing-count';count.className='drawing-count';count.setAttribute('role','status');$('#lt').append(count);
 function refresh(){undoButton.disabled=!past.length&&!tmp;redoButton.disabled=!future.length;count.textContent=D.length+' drawings';count.title=D.length+' drawings · '+past.length+' undo · '+future.length+' redo'}
 function record(before){if(same(before,snapshot())){refresh();return}past.push(before);if(past.length>100)past.shift();future.length=0;refresh()}
 function stopDrag(){drag=null;dragBefore=null;if(chart)chart.applyOptions({handleScroll:{mouseWheel:true,pressedMouseMove:true,horzTouchDrag:true,vertTouchDrag:true},handleScale:{mouseWheel:true,pinch:true,axisPressedMouseMove:{time:true,price:true},axisDoubleClickReset:{time:true,price:true}}})}
 function apply(state){D=copy(state.drawings);sel=state.selection>=0?D[state.selection]||null:null;tmp=null;stopDrag();refresh()}
 function undo(){if(tmp){if(tmp.k==='path'&&tmp.pts.length>1)tmp.pts.pop();else tmp=null;refresh();return}if(dragBefore)record(dragBefore);if(!past.length)return;future.push(snapshot());apply(past.pop())}
 function redo(){if(!future.length)return;past.push(snapshot());apply(future.pop())}
 function resetHistory(){past.length=future.length=0;dragBefore=null;drawingPointer=null;lastPathTap=null;suppressDrawingClickUntil=0;refresh();closeQuantity()}
 undoButton.onclick=undo;redoButton.onclick=redo;
 const clickDrawing=onClick;onClick=function(p){const before=snapshot();clickDrawing(p);record(before)};
 const completePath=finishPath;finishPath=function(){const before=snapshot();completePath();record(before)};
 const drawingButton=btn;btn=function(k){const before=k==='trash'?snapshot():null;drawingButton(k);if(before)record(before);else refresh()};
 const loadBeforeTools=load;load=function(bars){const result=loadBeforeTools(bars);resetHistory();return result};
 // Drawing clicks are handled before the chart's double-click recognizer so a
 // quick second point is never swallowed by the library.
 const drawingPoint=e=>{const r=$('#cw').getBoundingClientRect(),point={x:e.clientX-r.left,y:e.clientY-r.top};return point.x>=0&&point.y>=0&&point.x<$('#cw').clientWidth-chart.priceScale('right').width()&&point.y<$('#cw').clientHeight-28?point:null};
 addEventListener('pointerdown',e=>{if(!chart||e.button!==0||tool==='cur'||tool==='pan'||!$('#cw').contains(e.target)||e.target.closest('#chart-levels,#lg'))return;const point=drawingPoint(e);if(!point)return;drawingPointer={id:e.pointerId,tool};e.preventDefault();e.stopImmediatePropagation();if(typeof $('#cw').setPointerCapture==='function')$('#cw').setPointerCapture(e.pointerId)},true);
 addEventListener('pointermove',e=>{if(!chart||tool==='cur'||tool==='pan'||(!drawingPointer&&!$('#cw').contains(e.target))||e.target.closest('#chart-levels'))return;const point=drawingPoint(e);if(point)hov=pt2(point)},true);
 addEventListener('pointerup',e=>{if(!drawingPointer||drawingPointer.id!==e.pointerId)return;const active=drawingPointer;drawingPointer=null;e.preventDefault();e.stopImmediatePropagation();const point=drawingPoint(e);if(point&&tool===active.tool){const now=performance.now(),doublePath=active.tool==='path'&&lastPathTap&&now-lastPathTap.time<450&&Math.hypot(point.x-lastPathTap.x,point.y-lastPathTap.y)<7;onClick({point});if(doublePath)finishPath();lastPathTap=active.tool==='path'?{...point,time:now}:null}suppressDrawingClickUntil=performance.now()+100;if(typeof $('#cw').hasPointerCapture==='function'&&$('#cw').hasPointerCapture(e.pointerId))$('#cw').releasePointerCapture(e.pointerId)},true);
 addEventListener('pointercancel',()=>{drawingPointer=null},true);
 $('#cw').addEventListener('click',e=>{if(!e.target.closest('#chart-levels')&&performance.now()<suppressDrawingClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
 addEventListener('pointerdown',e=>{if(!chart||tool!=='cur'||e.button!==0||!$('#cw').contains(e.target)||e.target.closest('#chart-levels,#quantity-editor'))return;const r=$('#cw').getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(x<0||y<0||x>$('#cw').clientWidth-chart.priceScale('right').width()||y>$('#cw').clientHeight-28)return;if(hit(x,y))dragBefore=snapshot()},true);
 function endDrawingDrag(){if(dragBefore){const before=dragBefore;dragBefore=null;if(drag)record(before)}}
 addEventListener('pointerup',endDrawingDrag,true);
 addEventListener('pointercancel',()=>{endDrawingDrag();stopDrag()},true);
 addEventListener('blur',()=>{endDrawingDrag();stopDrag()});
 addEventListener('keydown',e=>{if(e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;const key=e.key.toLowerCase(),modifier=e.ctrlKey||e.metaKey;if(key==='escape')queueMicrotask(refresh);if(modifier&&(key==='z'||key==='y')){e.preventDefault();e.stopImmediatePropagation();if(key==='y'||e.shiftKey)redo();else undo();return}if((key==='delete'||key==='backspace')&&sel&&D.includes(sel)){e.preventDefault();e.stopImmediatePropagation();const before=snapshot();D.splice(D.indexOf(sel),1);sel=null;record(before)}},true);

 const editor=document.createElement('div');editor.id='quantity-editor';editor.hidden=true;editor.setAttribute('role','dialog');editor.setAttribute('aria-label','Change order quantity');editor.innerHTML='<form><div class="quantity-heading">Order quantity<button type="button" data-quantity-close aria-label="Close quantity editor">×</button></div><label for="chart-order-quantity">Contracts</label><input id="chart-order-quantity" type="number" min="1" max="1000" step="1" required><div class="quantity-step"><button type="button" data-step="-1" aria-label="Decrease quantity">−</button><button type="button" data-step="1" aria-label="Increase quantity">+</button></div><div class="quantity-presets"></div><p class="quantity-error" role="alert"></p><button class="quantity-apply" type="submit">Apply quantity</button></form>';
 document.body.append(editor);const quantityInput=editor.querySelector('input'),quantityError=editor.querySelector('.quantity-error');
 for(const value of [1,5,25,100,500,1000]){const button=document.createElement('button');button.type='button';button.textContent=value;button.setAttribute('aria-label','Set quantity to '+value);button.onclick=()=>{quantityInput.value=value;quantityError.textContent=''};editor.querySelector('.quantity-presets').append(button)}
 editor.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{quantityInput.value=Math.max(1,Math.min(1000,(+quantityInput.value||1)+ +button.dataset.step));quantityError.textContent=''});
 editor.querySelector('[data-quantity-close]').onclick=closeQuantity;
 function closeQuantity(){if(!quantityEdit)return;const anchor=quantityEdit.anchor;quantityEdit=null;editor.hidden=true;if(anchor?.isConnected)anchor.focus()}
 function openQuantity(id,anchor){const source=findLevelSource(id);if(!source||source.kind==='position')return;if(quantityEdit?.id===id){closeQuantity();return}pause();quantityEdit={id,anchor};quantityInput.value=source.kind==='draft'?$('#contracts').value:source.ref.q;quantityError.textContent='';editor.hidden=false;const rect=anchor.getBoundingClientRect();editor.style.left=Math.max(8,Math.min(rect.left,innerWidth-editor.offsetWidth-8))+'px';editor.style.top=Math.max(8,Math.min(rect.bottom+8,innerHeight-editor.offsetHeight-8))+'px';quantityInput.focus();quantityInput.select()}
 function syncQuantity(){if(quantityEdit&&!findLevelSource(quantityEdit.id))closeQuantity()}
 function applyQuantity(){if(!quantityEdit)return false;const source=findLevelSource(quantityEdit.id),q=+quantityInput.value;if(!source||source.kind==='position'){closeQuantity();return false}if(!Number.isInteger(q)||q<1||q>1000){quantityError.textContent='Choose 1–1000 whole contracts.';return false}if(source.kind==='order'){source.ref.q=q;redrawOrders()}$('#contracts').value=q;updateTicket();ui();positionLevels();closeQuantity();return true}
 editor.querySelector('form').onsubmit=e=>{e.preventDefault();applyQuantity()};
 editor.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeQuantity()}});
 addEventListener('pointerdown',e=>{if(quantityEdit&&!editor.contains(e.target)&&e.target!==quantityEdit.anchor)closeQuantity()},true);
 addEventListener('resize',closeQuantity);

 // Cache hover calculations while the same drawing and replay bar are unchanged.
 const hoverCache=new WeakMap(),originalTip=tipHTML;
 tipHTML=function(d){const key=i+':'+tf+':'+$('#qty').value+':'+d.pts.map(p=>p.t+','+p.p).join(';'),cached=hoverCache.get(d);if(cached?.key===key)return cached.html;const html=originalTip(d);hoverCache.set(d,{key,html});return html};
 if(new URLSearchParams(location.search).has('qa')){let last=performance.now(),start=last,frames=0,long=0,max=0;const meter=now=>{const interval=now-last;last=now;frames++;max=Math.max(max,interval);if(interval>50)long++;if(now-start>=2000){console.info('MicroBack QA '+JSON.stringify({fps:Math.round(frames*1000/(now-start)),longFrames:long,maxFrameMs:Math.round(max),bars:B.length,drawings:D.length}));start=now;frames=long=max=0}requestAnimationFrame(meter)};requestAnimationFrame(meter)}
 refresh();return{undo,redo,resetHistory,record,snapshot,refresh,openQuantity,closeQuantity,syncQuantity,applyQuantity};
})();

