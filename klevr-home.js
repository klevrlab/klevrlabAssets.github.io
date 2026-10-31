/* eslint-env browser */
/* KLEVR Lab front page helper. Loaded once from the guide's custom code box.
   - Loads the 3D headset viewer (data-viewer on the .kh-tech section) only when that section scrolls near the
     screen. On pages without these parts it does nothing. */
(function () {
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

  // Upcoming workshops: reads SJSU's events site (Localist API), keeps events that mention KLEVR, and builds cards.
  // Event text is added with textContent, never as HTML. If the feed cannot be read, the fallback text stays.
  const TZ = 'America/Los_Angeles'

  function pacific (iso, options) {
    return new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: TZ }, options)).format(new Date(iso))
  }

  function nextInstance (event, now) {
    const today = pacific(now, { year: 'numeric', month: '2-digit', day: '2-digit' })
    const found = (event.event_instances || [])
      .map(function (i) { return i.event_instance })
      .filter(function (i) {
        if (i.all_day) return pacific(i.start, { year: 'numeric', month: '2-digit', day: '2-digit' }) >= today
        return new Date(i.end || i.start) >= now
      })
      .sort(function (a, b) { return new Date(a.start) - new Date(b.start) })
    return found[0]
  }

  function whenText (inst) {
    const day = pacific(inst.start, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    if (inst.all_day) return day
    const time = { hour: 'numeric', minute: '2-digit' }
    const end = inst.end ? ' – ' + pacific(inst.end, time) : ''
    return day + ', ' + pacific(inst.start, time) + end
  }

  function cardFor (event, inst) {
    const li = document.createElement('li')
    li.className = 'kh-event'
    if (/^https:\/\/localist-images\.azureedge\.net\//.test(event.photo_url || '')) {
      const img = document.createElement('img')
      img.src = event.photo_url.replace('/huge/', '/card/')
      img.alt = ''
      img.width = 478
      img.height = 310
      img.loading = 'lazy'
      li.appendChild(img)
    }
    const body = document.createElement('div')
    body.className = 'kh-event-body'
    const h = document.createElement('h4')
    const a = document.createElement('a')
    a.href = event.localist_url
    a.textContent = event.title
    h.appendChild(a)
    const time = document.createElement('time')
    time.setAttribute('datetime', inst.start)
    time.textContent = whenText(inst)
    const place = document.createElement('p')
    place.className = 'kh-event-place'
    place.textContent = [event.location_name, event.room_number].filter(Boolean).join(', ') ||
      (event.experience === 'virtual' ? 'Online' : '')
    const text = (event.description_text || '').replace(/\s+/g, ' ').trim()
    const about = document.createElement('p')
    about.textContent = text.length > 150 ? text.slice(0, 150).replace(/\s+\S*$/, '') + '…' : text
    body.appendChild(h)
    body.appendChild(time)
    if (place.textContent) body.appendChild(place)
    if (text) body.appendChild(about)
    li.appendChild(body)
    return li
  }

  function setupEvents () {
    const box = document.querySelector('.klevr-home .kh-events[data-events]')
    if (!box || !window.fetch) return
    const list = box.querySelector('.kh-event-list')
    const status = box.querySelector('.kh-events-status')
    fetch(box.getAttribute('data-events'))
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)) })
      .then(function (data) {
        const now = new Date()
        const cards = (data.events || [])
          .map(function (w) { return w.event })
          .filter(function (e) { return /klevr/i.test([e.title, e.description_text, (e.tags || []).join(' '), (e.keywords || []).join(' ')].join(' ')) })
          .map(function (e) { return { event: e, inst: nextInstance(e, now) } })
          .filter(function (x) { return x.inst })
          .sort(function (a, b) { return new Date(a.inst.start) - new Date(b.inst.start) })
          .slice(0, 3)
        if (!cards.length) {
          status.textContent = 'No KLEVR Lab workshops are scheduled right now. Check back soon.'
          return
        }
        cards.forEach(function (x) { list.appendChild(cardFor(x.event, x.inst)) })
        status.hidden = true
      })
      .catch(function () { /* keep the fallback text and link */ })
  }

  function start () {
    setupViewer()
    setupEvents()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
