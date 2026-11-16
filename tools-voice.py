# Dabing (SK + EN) cez Microsoft Edge neurálne hlasy (balík edge-tts).
#   node tools-export.mjs > lines.json
#   python3 tools-voice.py lines.json                 # pregeneruje dist/voice/sk-*.mp3 + manifest
#   python3 tools-voice.py lines.json --sample OUT k1 k2 …   # len ukážky vybraných replík
# Slovenčina aj angličtina sa generujú celé nanovo (Microsoft neurálne hlasy).
import asyncio, edge_tts, edge_tts.communicate as C, inspect, textwrap, json, subprocess, os, sys, tempfile

# edge-tts natvrdo žiada 48 kb/s – vyžiadame 96 kb/s (neurálny hlas je natívne 24 kHz).
for n in dir(C.Communicate):
    f = getattr(C.Communicate, n)
    if callable(f) and 'stream' in n.lower() and 'outputFormat' in inspect.getsource(f):
        s = textwrap.dedent(inspect.getsource(f)).replace('self.__', 'self._Communicate__') \
            .replace('audio-24khz-48kbitrate-mono-mp3', 'audio-24khz-96kbitrate-mono-mp3')
        g = C.__dict__.copy(); exec(s, g); setattr(C.Communicate, n, g[f.__name__])

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'dist', 'voice'); MAN = os.path.join(ROOT, 'src', 'voice-manifest.json')
M, F = 'sk-SK-LukasNeural', 'sk-SK-ViktoriaNeural'
# who: (hlas, rýchlosť, výška) – len jemné rozdiely, max. ±10 %
V = {'narrator': (M, '-6%', '-4Hz'), 'player': (M, '+0%', '+4Hz'), 'katka': (F, '+2%', '+0Hz'),
     'anna': (F, '-9%', '-12Hz'), 'vb': (M, '+4%', '-6Hz'), 'peto': (M, '+8%', '+8Hz'),
     'kollar': (M, '-8%', '-10Hz'), 'igor': (M, '-2%', '+0Hz'), 'otec': (M, '-4%', '-7Hz'),
     'ondrej': (M, '-5%', '-11Hz'), 'zuzka': (F, '+6%', '+10Hz'), 'guard': (M, '-3%', '-8Hz'),
     'gerti': (F, '-2%', '-4Hz'), 'vlado': (M, '-7%', '-9Hz'), 'zuzana': (F, '+5%', '+6Hz'), 'milan': (M, '+7%', '+5Hz'),
     'jozef': (M, '-8%', '-12Hz'), 'rudolf': (M, '-11%', '-5Hz')}

# anglický dabing: britské neurálne hlasy, rovnaké jemné rozlíšenie postáv ako v slovenčine
EN = {'narrator': 'en-GB-RyanNeural', 'player': 'en-GB-ThomasNeural', 'katka': 'en-GB-SoniaNeural', 'anna': 'en-GB-LibbyNeural',
      'zuzka': 'en-GB-LibbyNeural', 'zuzana': 'en-GB-LibbyNeural', 'gerti': 'en-GB-SoniaNeural'}
EN_M = ['en-GB-RyanNeural', 'en-GB-ThomasNeural']

def norm(t):
    for a, b in [('„', ''), ('“', ''), ('”', ''), ('"', ''), ('ŠtB', 'eštébé'), ('VPN', 'vépéen'), ('SNP', 'esenpé'),
                 ('ČSSR', 'čéeseser'), ('VB', 'vébé'), ('od 12:00 do 14:00', 'od dvanástej do štrnástej'),
                 ('22:00', 'dvadsaťdva nula nula'), ('11:50', 'jedenásť päťdesiat'), ('Grüß Gott', 'Grýs Got'),
                 ('Willkommen', 'Vilkomen')]:
        t = t.replace(a, b)
    return t

async def tts(text, who, mp3, lang='sk'):
    v, rate, pitch = V[who]
    if lang == 'en': v = EN.get(who) or EN_M[sorted(V).index(who) % 2]
    for i in range(4):
        try: return await edge_tts.Communicate(norm(text) if lang == 'sk' else text.replace('ŠtB', 'S T B'), v, rate=rate, pitch=pitch).save(mp3)
        except Exception as e:
            if i == 3: raise
            await asyncio.sleep(2 + i * 3)

def ff(*a): subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *a], check=True)
def dur(p): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))
# 44,1 kHz, normalizovaná hlasitosť, 0,5 s ticha za replikou
AF = 'aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=11,apad=pad_dur=0.5'
ENC = ['-c:a', 'libmp3lame', '-b:a', '96k', '-ar', '44100', '-ac', '1']

async def main():
    lines = json.load(open(sys.argv[1])); tmp = tempfile.mkdtemp()
    if '--sample' in sys.argv:
        i = sys.argv.index('--sample'); out = sys.argv[i + 1]; os.makedirs(out, exist_ok=True)
        for k in sys.argv[i + 2:]:
            l = next(x for x in lines if x['key'] == k)
            await tts(l['sk'], l['who'], f'{tmp}/r.mp3'); ff('-i', f'{tmp}/r.mp3', '-af', AF, *ENC, f'{out}/{k}.mp3')
            print(k, l['who'])
        return
    man = {}
    for lang in ('sk', 'en'):
        for ch in dict.fromkeys(l['ch'] for l in lines):
            pos = 0.0; lst = []
            for i, l in enumerate(x for x in lines if x['ch'] == ch):
                raw, wav = f'{tmp}/{lang}-{ch}-{i}.mp3', f'{tmp}/{lang}-{ch}-{i}.wav'
                await tts(l[lang], l['who'], raw, lang); ff('-i', raw, '-af', AF, '-ar', '44100', '-ac', '1', wav)
                d = dur(wav); man[f"{lang}/{l['key']}"] = [f'{lang}-{ch}.mp3', round(pos, 3), round(d - 0.45, 3)]
                pos += d; lst.append(f"file '{wav}'")
            open(f'{tmp}/{lang}-{ch}.txt', 'w').write('\n'.join(lst))
            ff('-f', 'concat', '-safe', '0', '-i', f'{tmp}/{lang}-{ch}.txt', *ENC, f'{OUT}/{lang}-{ch}.mp3')
            print(lang, ch, round(pos), flush=True)
    json.dump(man, open(MAN, 'w'))
    print('DONE')

asyncio.run(main())
