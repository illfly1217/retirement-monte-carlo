// A shared tooltip surface stays outside the scrolling parameter drawer.
export function fieldHelp(root){
  const tooltip=document.createElement('div');
  tooltip.id='field-tooltip';
  tooltip.className='field-tooltip';
  tooltip.setAttribute('role','tooltip');
  tooltip.hidden=true;
  document.body.append(tooltip);
  let active=null,pinned=false,hideTimer;

  function close(){
    clearTimeout(hideTimer);
    active?.removeAttribute('data-open');
    active=null;pinned=false;tooltip.hidden=true;
  }
  function show(trigger,pin=false){
    clearTimeout(hideTimer);
    if(active!==trigger){close();active=trigger;}
    pinned=pinned||pin;
    tooltip.textContent=trigger.dataset.help;
    tooltip.hidden=false;
    trigger.setAttribute('data-open','');
    position();
  }
  function position(){
    if(!active)return;
    const anchor=active.getBoundingClientRect(),box=tooltip.getBoundingClientRect();
    const boundary=root.getBoundingClientRect();
    if(anchor.bottom<Math.max(0,boundary.top)||anchor.top>Math.min(innerHeight,boundary.bottom)){close();return;}
    tooltip.style.left=Math.max(12,Math.min(anchor.left,innerWidth-box.width-12))+'px';
    const top=anchor.top-box.height-8;
    tooltip.style.top=Math.max(12,Math.min(top>=12?top:anchor.bottom+8,innerHeight-box.height-12))+'px';
  }
  function leave(){
    if(!pinned&&document.activeElement!==active)hideTimer=setTimeout(close,120);
  }
  root.querySelectorAll('.field-help').forEach((trigger,index)=>{
    // Keep a stable description for assistive technology even while hidden.
    const description=document.createElement('span');
    description.id='field-description-'+index;
    description.hidden=true;
    description.textContent=trigger.dataset.help;
    trigger.after(description);
    trigger.setAttribute('aria-describedby',description.id);
    trigger.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'&&!pinned)show(trigger);});
    trigger.addEventListener('pointerleave',leave);
    trigger.addEventListener('focus',()=>show(trigger));
    trigger.addEventListener('blur',close);
    trigger.addEventListener('click',()=>{if(active===trigger&&pinned)close();else show(trigger,true);});
  });
  tooltip.addEventListener('pointerenter',()=>clearTimeout(hideTimer));
  tooltip.addEventListener('pointerleave',leave);
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.field-help')&&!tooltip.contains(event.target))close();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  document.addEventListener('scroll',position,true);
  window.addEventListener('resize',close);
  root.addEventListener('input',close);
}
