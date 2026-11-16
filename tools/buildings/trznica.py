# Stará tržnica, Námestie SNP (Bratislava) – zjednodušený model podľa fotografie
# https://commons.wikimedia.org/wiki/File:Bratislava_stará_tržnica_1.jpg (Wizzard, public domain)
#   blender -b -P tools/buildings/trznica.py -- assets/buildings/trznica.glb [nahlad.png]
# Šírka 46 m, hĺbka 14 m; stredný rizalit so štítom a tromi vysokými oblúkovými oknami, nižšie krídla, nárožné pavilóny.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

palette({
    'plaster': (232, 230, 220),
    'trim': (248, 247, 240),
    'base': (188, 184, 172),
    'roof': ((120, 70, 56), 0.8, 0.0),
    'glass': ((36, 42, 52), 0.25, 0.0),
    'door': (60, 44, 32),
    'metal': ((70, 80, 84), 0.5, 0.5),
})
W, D = 46.0, 14.0
F = -D / 2
def archwin(x, y, z, w, h):
    """vysoké okno s polkruhovým záklenkom"""
    box(x, y + 0.02, z, w, 0.06, h, 'glass'); cyl(x, y + 0.02, z + h, w / 2, 0.06, 'glass', seg=20, axis='y')
    cyl(x, y - 0.06, z + h, w / 2 + 0.22, 0.14, 'trim', seg=20, axis='y'); cyl(x, y - 0.1, z + h, w / 2, 0.14, 'glass', seg=20, axis='y')
    for sx in (-1, 1): box(x + sx * (w / 2 + 0.11), y - 0.06, z, 0.22, 0.14, h, 'trim')
    box(x, y - 0.08, z, 0.08, 0.06, h + w / 2, 'trim')
    for zz in (z + h * 0.33, z + h * 0.66, z + h): box(x, y - 0.08, zz, w, 0.06, 0.08, 'trim')
    box(x, y - 0.1, z - 0.16, w + 0.7, 0.3, 0.16, 'trim')
# krídla (nižšie) a nárožné pavilóny
for s in (-1, 1):
    box(s * 13.5, 0, 0, 11, D, 9.2, 'plaster'); box(s * 13.5, 0, 0, 11.1, D + 0.1, 1.2, 'base')
    box(s * 13.5, 0, 9.2, 11.4, D + 0.5, 0.5, 'trim'); box(s * 13.5, 0.2, 9.7, 10.6, D - 0.8, 1.4, 'roof')
    for i in range(3):
        x = s * (9.6 + i * 3.6)
        archwin(x, F, 5.0, 1.7, 2.3)
        box(x, F - 0.03, 1.0, 2.0, 0.06, 2.6, 'door' if i == 1 else 'glass'); box(x, F - 0.08, 3.6, 2.4, 0.16, 0.18, 'trim')
    box(s * 21, 0, 0, 4, D, 11.0, 'plaster'); box(s * 21, 0, 0, 4.1, D + 0.1, 1.2, 'base')
    box(s * 21, 0, 11.0, 4.5, D + 0.5, 0.5, 'trim'); box(s * 21, 0, 11.5, 3.6, D - 1, 1.6, 'roof')
    archwin(s * 21, F, 5.4, 1.6, 2.6); box(s * 21, F - 0.03, 1.0, 1.8, 0.06, 2.8, 'glass')
    for j in range(3):
        for (z, h) in ((1.4, 2.4), (5.4, 2.8)): box(s * (W / 2 + 0.02), F + (j + 0.5) * D / 3, z, 0.06, 1.6, h, 'glass')
# stredný rizalit so štítom
CW, CH, FC = 16.0, 13.0, F - 1.6
box(0, -0.8, 0, CW, D + 1.6, CH, 'plaster'); box(0, -0.8, 0, CW + 0.1, D + 1.7, 1.2, 'base')
box(0, -0.8, CH, CW + 0.7, D + 2.2, 0.6, 'trim')
prism(0, FC - 0.35, CH + 0.6, CW + 0.7, 3.4, 0.7, 'trim'); prism(0, FC - 0.4, CH + 0.95, CW - 1.6, 2.5, 0.2, 'plaster')
box(0, -0.6, CH + 0.6, CW - 0.6, D, 1.2, 'roof'); prism(0, FC + 0.3, CH + 0.6, CW, 3.2, D + 0.6, 'roof')
for x in (-4.6, 0, 4.6):
    archwin(x, FC, 5.6, 3.0, 4.6)
    box(x, FC - 0.03, 1.0, 3.0, 0.06, 3.2, 'door' if x == 0 else 'glass'); box(x, FC - 0.1, 4.2, 3.6, 0.2, 0.25, 'trim')
for x in (-7.3, -2.3, 2.3, 7.3):
    box(x, FC - 0.2, 1.2, 0.9, 0.4, CH - 1.2, 'trim'); box(x, FC - 0.25, CH - 0.6, 1.2, 0.5, 0.6, 'trim'); box(x, FC - 0.25, 1.2, 1.2, 0.5, 0.5, 'trim')
box(0, FC - 0.12, 4.55, 9.0, 0.1, 0.8, 'trim')                       # tabuľa pre nápis (text dopĺňa hra)
cyl(0, FC - 0.3, CH + 1.9, 0.9, 0.16, 'trim', seg=20, axis='y'); cyl(0, FC - 0.36, CH + 1.9, 0.65, 0.1, 'glass', seg=20, axis='y')
# kovový svetlík haly
box(0, 0.5, CH + 2.6, 5, D - 3, 0.9, 'metal'); box(0, 0.5, CH + 3.5, 5.6, D - 2.6, 0.2, 'metal')
finish('trznica', cam=(5, -52, 3.0), look=(0, -7, 8.0), lens=28)
