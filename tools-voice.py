import sherpa_onnx, numpy as np, soundfile as sf, json, subprocess, os, re, sys
lines=json.load(open('lines.json'))
OUT='/home/user/Game/dist/voice'; os.makedirs(OUT,exist_ok=True); os.makedirs('seg',exist_ok=True)
d="vits-piper-sk_SK-lili-medium"
sk=sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{d}/sk_SK-lili-medium.onnx",tokens=f"{d}/tokens.txt",data_dir=f"{d}/espeak-ng-data"),num_threads=4)))
d="kokoro-en-v0_19"
en=sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f"{d}/model.onnx",voices=f"{d}/voices.bin",tokens=f"{d}/tokens.txt",data_dir=f"{d}/espeak-ng-data"),num_threads=4)))
# who: (sk pitch, sk speed, en speaker, en pitch, en speed)
V={'narrator':(0.70,0.95,9,0.97,0.95),'player':(0.76,1.0,10,1.0,1.0),'katka':(1.0,1.0,7,1.0,1.0),'anna':(0.93,0.88,8,0.94,0.9),
'vb':(0.68,1.05,6,0.93,1.05),'peto':(0.80,1.08,5,1.04,1.08),'kollar':(0.63,0.9,9,0.88,0.9),'igor':(0.73,0.97,10,0.94,0.97),
'otec':(0.67,0.94,6,0.9,0.95),'ondrej':(0.61,0.95,5,0.86,0.96),'zuzka':(1.05,1.06,3,1.0,1.05),'guard':(0.65,0.92,9,0.92,0.93),'gerti':(0.97,0.98,2,1.0,1.0)}
def norm(t,lang):
    t=t.replace('–',',').replace('—',',').replace('„','').replace('“','').replace('”','').replace('"','')
    if lang=='sk':
        for a,b in [('ŠtB','eštébé'),('VPN','vépéen'),('SNP','esenpé'),('ČSSR','čéeseser'),('VB','vébé'),('od 12:00 do 14:00','od dvanástej do štrnástej'),('22:00','dvadsaťdva nula nula'),('11:50','jedenásť päťdesiat'),('Grüß Gott','Grýs Got'),('Willkommen','Vilkomen'),('1988','tisícdeväťstoosemdesiatosem'),('1989','tisícdeväťstoosemdesiatdeväť')]: t=t.replace(a,b)
    else:
        for a,b in [('ŠtB','S T B'),('VPN','V P N'),('SNP','S N P'),('Peťo','Petyo'),('Mráz','Mraaz'),('Ján','Yaan'),('Jano','Yano'),('Hviezdoslav','Hvyezdoslav'),('Petržalka','Petrzhalka'),('Šťastný','Shtyastnee'),('Mikloško','Mikloshko'),('Krčméry','Krchmeri'),('Čalfa','Chalfa'),('Dubček','Doobcheck'),('Husák','Hoosaak'),('Václav','Vaatslav'),('Národní třída','Naarodnee Trzheeda'),('Národní','Naarodnee'),('Umelecká beseda','Oomeletska beseda'),('Európa','Europa'),('Ahoj','Ahoy')]: t=t.replace(a,b)
    return t
man={}
for lang,tts in (('sk',sk),('en',en)):
    for ch in dict.fromkeys(l['ch'] for l in lines):
        segs=[];pos=0.0;lst=open(f'seg/{lang}-{ch}.txt','w')
        for i,l in enumerate([x for x in lines if x['ch']==ch]):
            v=V[l['who']]
            if lang=='sk': a=tts.generate(norm(l['sk'],'sk'),sid=0,speed=v[1]); pitch=v[0]
            else: a=tts.generate(norm(l['en'],'en'),sid=v[2],speed=v[4]); pitch=v[3]
            x=np.array(a.samples,dtype=np.float32); raw=f'seg/{lang}-{ch}-{i}r.wav'; fin=f'seg/{lang}-{ch}-{i}.wav'
            sf.write(raw,x,a.sample_rate)
            af=(f'rubberband=pitch={pitch}:formant=shifted,' if abs(pitch-1)>0.01 else '')+'aresample=24000,loudnorm=I=-18:TP=-2,apad=pad_dur=0.5'
            subprocess.run(['ffmpeg','-y','-loglevel','error','-i',raw,'-af',af,'-ar','24000','-ac','1',fin],check=True)
            dur=sf.info(fin).duration
            man[f"{lang}/{l['key']}"]=[f'{lang}-{ch}.mp3',round(pos,3),round(dur-0.45,3)]
            pos+=dur; lst.write(f"file '{os.path.abspath(fin)}'\n")
        lst.close()
        subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',f'seg/{lang}-{ch}.txt','-c:a','libmp3lame','-b:a','48k','-ar','24000','-ac','1',f'{OUT}/{lang}-{ch}.mp3'],check=True)
        print(lang,ch,round(pos),flush=True)
json.dump(man,open('/home/user/Game/src/voice-manifest.json','w'))
print('DONE')
