# Univerzita Komenského, Šafárikovo námestie (Bratislava) – zjednodušený model podľa fotografie
# https://commons.wikimedia.org/wiki/File:Šafárikovo_námestie_(Šafárikovo_Square)_and_Univerzita_Komenského_(Comenius_University)_in_Bratislava,_Slovak_Republic.JPG (Kiwiev, CC0)
#   blender -b -P tools/buildings/uk.py -- assets/buildings/uk.glb [nahlad.png]
# Šírka 40 m, hĺbka 16 m; oblé stredné priečelie s vysokými oknami medzi piliermi, kolonáda v prízemí, nárožné veže.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

palette({
    'plaster': (201, 168, 112),            # okrový kamenný obklad
    'trim': (222, 196, 146),
    'stone': (150, 132, 100),
    'roof': ((96, 92, 86), 0.7, 0.1),
    'glass': ((34, 40, 50), 0.25, 0.0),
    'door': (62, 44, 30),
})
W, D, H = 40.0, 16.0, 17.0
F = -D / 2
TW = 8.0                     # šírka nárožných blokov
# nárožné bloky s vežičkami
for s in (-1, 1):
    x = s * (W / 2 - TW / 2)
    box(x, 0, 0, TW, D, H + 2.2, 'plaster'); box(x, 0, H + 2.2, TW + 0.5, D + 0.5, 0.5, 'trim')
    box(x, F + 2.5, H + 2.7, 3.2, 3.2, 2.2, 'plaster'); box(x, F + 2.5, H + 4.9, 3.6, 3.6, 0.35, 'trim'); box(x, F + 2.5, H + 5.25, 1.6, 1.6, 1.2, 'stone')
    box(x, F - 0.05, 0, TW + 0.1, 0.1, 4.6, 'stone')
    for i in range(2):
        wx = x + (i - 0.5) * 3.4
        for k, (z, h) in enumerate(((1.4, 2.4), (5.6, 2.6), (9.4, 2.6), (13.2, 2.4), (16.6, 1.6))): window(wx, F, z, 1.5, h)
    for j in range(4):
        y = F + (j + 0.5) * D / 4
        for (z, h) in ((1.4, 2.4), (5.6, 2.6), (9.4, 2.6), (13.2, 2.4)): box(s * (W / 2 + 0.02), y, z, 0.06, 1.5, h, 'glass')
# stredná hmota a zadný trakt
CWd = W - 2 * TW
box(0, 1.0, 0, CWd, D - 2, H, 'plaster')
for i in range(8):
    for (z, h) in ((1.4, 2.4), (5.6, 2.6), (9.4, 2.6)): box(-W / 2 + (i + 0.5) * W / 8, D / 2 + 0.02, z, 1.5, 0.06, h, 'glass')
# oblé priečelie: 7 polí na kruhovom oblúku, vysoké okná cez tri podlažia medzi piliermi
R, N = 26.0, 7
half = math.asin((CWd / 2) / R)
cy = F - 3.2 + R             # stred oblúka (vypuklý smerom k námestiu)
def arc(a, r=R): return (math.sin(a) * r, cy - math.cos(a) * r)
import bmesh as _b
def seg(a0, a1, z, h, mat, r0=R, depth=1.0):
    """úsek valcovej steny medzi uhlami a0, a1"""
    (x0, y0), (x1, y1) = arc(a0, r0), arc(a1, r0)
    (x2, y2), (x3, y3) = arc(a1, r0 - depth), arc(a0, r0 - depth)
    vs = [bm.verts.new(p) for p in [(x0, y0, z), (x1, y1, z), (x2, y2, z), (x3, y3, z), (x0, y0, z + h), (x1, y1, z + h), (x2, y2, z + h), (x3, y3, z + h)]]
    for f in [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7), (3, 2, 1, 0)]: bm.faces.new([vs[i] for i in f]).material_index = MI[mat]
seg(-half, half, 0, 0.6, 'stone', R + 1.6, 3.0)                       # schody
seg(-half, half, 0.3, 0.3, 'stone', R + 0.8, 2.0)
seg(-half, half, 4.6, 0.7, 'trim', R + 0.35, 2.2)                     # preklad nad kolonádou
seg(-half, half, H - 1.2, 1.0, 'trim', R + 0.3, 1.6)                  # kladie
seg(-half, half, H - 0.2, 2.6, 'plaster', R + 0.05, 2.0)              # atika s nápisom
seg(-half, half, H + 2.4, 0.4, 'trim', R + 0.4, 2.6)
seg(-half, half, 0, H, 'glass', R - 1.0, 0.2)                         # tmavá výplň za oknami
seg(-half, half, 5.3, H - 6.5, 'plaster', R - 0.6, 0.5)
box(0, cy - R / 2 + 2.6, 0, CWd, R - 6.5, H + 2.4, 'plaster') if False else None
for i in range(N + 1):
    a = -half + i * 2 * half / N
    da = 0.55 / R
    seg(a - da, a + da, 0.6, 4.0, 'trim', R, 1.0)                     # piliere kolonády
    seg(a - da * 1.15, a + da * 1.15, 5.3, H - 6.5, 'trim', R + 0.12, 0.9)   # pilastre
    if i < N:
        am = a + half / N
        dw = 1.25 / R
        seg(am - dw, am + dw, 5.9, H - 7.9, 'glass', R - 0.45, 0.2)   # vysoké okno
        for zz in (8.6, 11.4): seg(am - dw, am + dw, zz, 0.5, 'trim', R - 0.38, 0.2)
        seg(am - 0.02 / R * 3, am + 0.02 / R * 3, 5.9, H - 7.9, 'trim', R - 0.38, 0.2)
        if 1 <= i <= 5: seg(am - 1.0 / R, am + 1.0 / R, 0.6, 3.4, 'door', R - 1.6, 0.15)
# výplň medzi oblúkom a hmotou + plochá strecha
box(0, F + 0.4, 0, CWd, 3.0, H, 'plaster')
box(0, 1.0, H, CWd + 0.4, D - 1.6, 0.4, 'roof')
finish('uk', cam=(-6, -50, 3.0), look=(0, -9, 9.5), lens=30)
