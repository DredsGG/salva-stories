"""Teste real no Firefox (CI): instala a extensão como temporária, roda o fluxo principal no Instagram simulado
(server.mjs), o tutorial de primeiro uso e o quadro de novidades. Uso: python run_firefox.py <pasta-da-extensao> <pasta-de-saida>"""
import json, os, subprocess, sys, time, glob
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.actions.action_builder import ActionBuilder

EXT, OUT = sys.argv[1], sys.argv[2]
DL = os.path.join(OUT, 'downloads'); os.makedirs(DL, exist_ok=True)
o = Options()
o.add_argument('-headless')
o.accept_insecure_certs = True
o.set_preference('browser.download.folderList', 2)
o.set_preference('browser.download.dir', DL)
o.set_preference('browser.download.useDownloadDir', True)
o.set_preference('browser.download.always_ask_before_handling_new_types', False)
o.set_preference('browser.download.alwaysOpenPanel', False)
o.set_preference('intl.accept_languages', 'pt-BR')
d = webdriver.Firefox(options=o)
d.set_window_size(1280, 900)
res = {'firefox': d.capabilities.get('browserVersion')}
ok = True

def check(name, cond, info=None):
    global ok
    res[name] = {'ok': bool(cond), 'info': info}
    ok = ok and bool(cond)

def js(s):
    return d.execute_script(s)

def wait_for(fn, t=15):
    end = time.time() + t
    while time.time() < end:
        try:
            v = fn()
            if v: return v
        except Exception:
            pass
        time.sleep(0.3)
    return None

def click(x, y):
    a = ActionBuilder(d); a.pointer_action.move_to_location(int(x), int(y)).click(); a.perform()

def key(k, shift=False):
    a = ActionChains(d)
    if shift: a.key_down('')
    a.send_keys(k)
    if shift: a.key_up('')
    a.perform()

def files():
    return sorted(p for p in glob.glob(os.path.join(DL, '**', '*'), recursive=True) if os.path.isfile(p) and not p.endswith('.part'))

try:
    d.install_addon(EXT, temporary=True)
    time.sleep(3)
    main = d.current_window_handle
    for h in d.window_handles:  # o guia de instalação abre numa aba própria
        if h != main:
            d.switch_to.window(h); res['guideTab'] = d.current_url[:60]; d.save_screenshot(os.path.join(OUT, 'ff-guia.png')); d.close()
    d.switch_to.window(main)

    # 1) feed: tutorial de instalação nova
    d.get('https://www.instagram.com/')
    ob = wait_for(lambda: js('return window.__salvaStoriesOnboardDebug && window.__salvaStoriesOnboardDebug().open'))
    check('tutorialOnInstall', ob == 'tutorial', ob)
    d.save_screenshot(os.path.join(OUT, 'ff-tutorial.png'))
    st = js('return window.__salvaStoriesOnboardDebug()')
    if st and st.get('at') and st['at'].get('next'):
        click(st['at']['next']['x'], st['at']['next']['y']); time.sleep(0.4)
    check('tutorialNext', js('return window.__salvaStoriesOnboardDebug().step') == 1)
    key(''); time.sleep(0.4)  # Esc
    check('tutorialEsc', js('return window.__salvaStoriesOnboardDebug().open') is None)

    # 2) menu (Alt+S) com rodapé e "?"
    a = ActionChains(d); a.key_down('').send_keys('s').key_up('').perform(); time.sleep(0.8)
    m = js('return window.__salvaStoriesMenuDebug()')
    check('menuOpens', m and m.get('open'), m and m.get('version'))
    check('footer', m and m.get('at') and m['at'].get('uchk') and m['at'].get('ubug') and m['at'].get('dreds'), m and m.get('at'))
    check('versionFromManifest', m and m.get('version') == json.load(open(os.path.join(EXT, 'manifest.json')))['version'], m and m.get('version'))
    d.save_screenshot(os.path.join(OUT, 'ff-menu.png'))
    if m and m.get('at') and m['at'].get('help'):
        click(m['at']['help']['x'], m['at']['help']['y']); time.sleep(0.6)
    check('helpReopensTutorial', js('return window.__salvaStoriesOnboardDebug().open') == 'tutorial')
    key(''); time.sleep(0.3)
    # atualização (consulta a API do GitHub de verdade) e relatório de bug
    up = wait_for(lambda: js('const u = window.__salvaStoriesMenuDebug().upd; return u && (u.procuradoEm ? u : null)'), 20)
    res['updateState'] = up and {k: up.get(k) for k in ('ultima', 'disponivel', 'firefox', 'erro', 'instalacao')}
    check('updateCheckRuns', up and up.get('firefox') is True and not up.get('erro'), res['updateState'])

    # 3) stories: foto com D e vídeo DASH (juntado no fundo; no Firefox sai por blob:) com D
    d.get('https://www.instagram.com/stories/example.profile/111/')
    wait_for(lambda: js('return window.__salvaStoriesDebug && window.__salvaStoriesDebug().current'), 15)
    time.sleep(1)
    d.save_screenshot(os.path.join(OUT, 'ff-story.png'))
    before = len(files()); key('d')
    wait_for(lambda: len(files()) > before, 20)
    f = files()
    photo = [p for p in f if p.endswith('.jpg')]
    check('photoSaved', photo and os.path.getsize(photo[0]) > 1000 and '/Instagram Stories/example.profile/stories/' in photo[0].replace('\\', '/'), [os.path.relpath(p, DL) + ' ' + str(os.path.getsize(p)) for p in f])
    d.get('https://www.instagram.com/stories/example.profile/222/')
    wait_for(lambda: js('return window.__salvaStoriesDebug && window.__salvaStoriesDebug().current'), 15)
    time.sleep(1)
    before = len(files()); key('d')
    wait_for(lambda: any(p.endswith('.mp4') for p in files()), 40)
    time.sleep(2)
    mp4 = [p for p in files() if p.endswith('.mp4')]
    probe = None
    if mp4:
        probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height', '-of', 'json', mp4[0]], capture_output=True, text=True).stdout
        probe = [(s.get('codec_type'), s.get('width'), s.get('height')) for s in json.loads(probe or '{}').get('streams', [])]
    check('dashVideoMuxed', probe and ('video', 1080, 1920) in probe and any(s[0] == 'audio' for s in probe), probe)

    # 4) atualização simulada → "Novidades da vX.Y.Z" uma vez
    js("window.postMessage({ __salvaStories: 'page', kind: 'lset', id: 9999, key: 'ss.onboard', value: { tutorial: 'visto', visto: '1.6.3' } }, location.origin)")
    time.sleep(1)
    d.get('https://www.instagram.com/')
    nv = wait_for(lambda: js('const x = window.__salvaStoriesOnboardDebug(); return x.open === "news" ? x : null'))
    check('newsAfterUpdate', nv and nv.get('items') and len(nv['items']) >= 3, nv and nv.get('title'))
    d.save_screenshot(os.path.join(OUT, 'ff-novidades.png'))
    key(''); time.sleep(0.3)
    d.get('https://www.instagram.com/'); time.sleep(3)
    check('newsOnlyOnce', js('return window.__salvaStoriesOnboardDebug().open') is None)
    logs = js('const a = window[Symbol.for("salvaStories.api")]; return a && a.logs ? a.logs().slice(-15).map(l => l.level + " " + l.msg) : null')
    res['log'] = logs
finally:
    d.quit()

res['ok'] = ok
print(json.dumps(res, indent=1, ensure_ascii=False))
with open(os.path.join(OUT, 'resultado.json'), 'w') as fh:
    json.dump(res, fh, indent=1, ensure_ascii=False)
sys.exit(0 if ok else 1)
