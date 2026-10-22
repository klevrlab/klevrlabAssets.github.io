/* eslint-env browser */
/* KLEVR Lab front page helper. Loaded once from the guide's custom code box.
   - Loads the YouTube player only when the visitor presses the play button.
   - Loads the 3D headset viewer (data-viewer on the .kh-tech section) only when that section scrolls near the
     screen. On pages without these parts it does nothing. */
(function () {
  function setupVideo () {
    const frames = document.querySelectorAll('.klevr-home .kh-video-frame[data-video-id]')
    Array.prototype.forEach.call(frames, function (frame) {
      if (frame.getAttribute('data-kh-ready')) return
      frame.setAttribute('data-kh-ready', '1')
      const button = frame.querySelector('.kh-video-play')
      if (!button) return
      button.addEventListener('click', function () {
        const id = encodeURIComponent(frame.getAttribute('data-video-id'))
        const iframe = document.createElement('iframe')
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&cc_load_policy=1'
        iframe.title = frame.getAttribute('data-video-title') || 'Video'
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture'
        iframe.setAttribute('allowfullscreen', '')
        frame.replaceChild(iframe, button)
        iframe.focus()
      })
    })
  }

  function setupViewer () {
    const section = document.querySelector('.klevr-home .kh-tech[data-viewer]')
    if (!section || section.getAttribute('data-kh-loading')) return
    section.setAttribute('data-kh-loading', '1')
    function load () {
      const el = document.createElement('script')
      el.src = section.getAttribute('data-viewer')
      el.async = true
      document.head.appendChild(el)
    }
    if (!('IntersectionObserver' in window)) return load()
    const observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          observer.disconnect()
          load()
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(section)
  }

  function start () {
    setupVideo()
    setupViewer()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
