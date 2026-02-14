// hover-preview.js
// Shows an image preview when hovering links that have a `data-preview` attribute.
(function(){
  function ready(fn){ if(document.readyState!='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function(){
    const tooltip = document.createElement('div');
    tooltip.className = 'hover-preview-tooltip';
    const img = document.createElement('img');
    img.alt = 'preview';
    tooltip.appendChild(img);
    document.body.appendChild(tooltip);

    let active = false;

    function show(e, src){
      if(!src) return;
      img.src = src;
      tooltip.style.display = 'block';
      active = true;
      position(e);
    }

    function position(e){
      if(!active) return;
      const offset = 18;
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      let x = e.clientX + offset;
      let y = e.clientY + offset;
      // keep inside viewport
      const rect = tooltip.getBoundingClientRect();
      if (x + rect.width + 10 > vw) x = e.clientX - rect.width - offset;
      if (y + rect.height + 10 > vh) y = e.clientY - rect.height - offset;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }

    function hide(){
      active = false;
      tooltip.style.display = 'none';
      img.src = '';
    }

    // show on links with data-preview attribute
    document.body.addEventListener('mouseover', function(e){
      const a = e.target.closest('a');
      if(!a) return;
      const src = a.dataset.preview || a.getAttribute('data-preview');
      if(src){ show(e, src); }
    });

    document.body.addEventListener('mousemove', function(e){ position(e); });

    document.body.addEventListener('mouseout', function(e){
      const a = e.target.closest('a');
      if(!a) return;
      const src = a.dataset.preview || a.getAttribute('data-preview');
      if(src){ hide(); }
    });
  });
})();
