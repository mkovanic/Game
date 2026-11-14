# Historická budova SND (Hviezdoslavovo námestie, Bratislava) – zjednodušený model podľa fotografie
# https://commons.wikimedia.org/wiki/File:Bratislava_Hviezdoslavovo_nam_opera_SND.jpg (Peter Zelizňák, public domain).
#   blender -b -P tools/buildings/snd.py -- assets/buildings/snd.glb [nahlad.png]
# Os: priečelie smeruje k -Y (v glTF +Z), stred pôdorysu v počiatku, šírka 36 m, hĺbka 18 m.
import bpy, bmesh, sys, math
from mathutils import Vector, Matrix

args = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)

def material(name, rgb, rough=0.85, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*[((c / 255) ** 2.2) for c in rgb], 1)
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    m.diffuse_color = (*[c / 255 for c in rgb], 1)
    return m

M = {
    'plaster': material('plaster', (236, 222, 170)),      # krémovožltá omietka
    'trim': material('trim', (244, 240, 224)),            # biele články: rímsy, pilastre, šambrány
    'rustica': material('rustica', (172, 138, 118)),      # bosovaný prízemný sokel
    'stone': material('stone', (150, 142, 130)),          # sokel, schody
    'roof': material('roof', (150, 158, 164), 0.5, 0.4),  # zinková strecha a kupola
    'glass': material('glass', (38, 44, 54), 0.25),       # okná (v hre sa v noci rozsvietia)
    'door': material('door', (58, 40, 28)),
    'bronze': material('bronze', (70, 66, 50), 0.5, 0.6),
}
bm = bmesh.new()
MI = {k: i for i, k in enumerate(M)}

def add(geom, mat):
    for f in {f for e in geom for f in (e.link_faces if isinstance(e, bmesh.types.BMVert) else [])}: f.material_index = MI[mat]

def box(x, y, z, sx, sy, sz, mat):
    """kváder: stred x, y; spodok z"""
    r = bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((x, y, z + sz / 2)) @ Matrix.Diagonal((sx, sy, sz, 1)))
    add(r['verts'], mat)

def cyl(x, y, z, r, h, mat, seg=12, r2=None, axis='z'):
    m = Matrix.Translation((x, y, z + (h / 2 if axis == 'z' else 0)))
    if axis == 'y': m = m @ Matrix.Rotation(math.pi / 2, 4, 'X')
    g = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h, matrix=m)
    add(g['verts'], mat)

def ball(p, r, mat='bronze'):
    add(bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r, matrix=Matrix.Translation(p))['verts'], mat)

def prism(x, y, z, w, h, d, mat):
    """trojuholníkový štít: šírka w, výška h, hĺbka d (stred x, predná hrana y)"""
    vs = [bm.verts.new(p) for p in [(x - w / 2, y, z), (x + w / 2, y, z), (x, y, z + h), (x - w / 2, y + d, z), (x + w / 2, y + d, z), (x, y + d, z + h)]]
    for f in [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]:
        bm.faces.new([vs[i] for i in f]).material_index = MI[mat]

def dome(x, y, z, rx, ry, rz, mat, seg=20, rings=7, top=0.82):
    """zrezaná elipsoidná kupola"""
    g = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings * 2, radius=1, matrix=Matrix.Translation((x, y, z)) @ Matrix.Diagonal((rx, ry, rz, 1)))
    kill = [v for v in g['verts'] if v.co.z < z - 1e-4]
    bmesh.ops.delete(bm, geom=kill, context='VERTS')
    live = [v for v in g['verts'] if v.is_valid]
    for v in live: v.co.z = min(v.co.z, z + rz * top)
    add(live, mat)

def window(x, y, z, w, h, depth=0.18, ped=None, face=-1):
    """okno na priečelí (rovina y): sklo, šambrána, parapet, voliteľne štít"""
    box(x, y + face * 0.02, z, w, 0.06, h, 'glass')
    f = 0.16
    box(x - w / 2 - f / 2, y + face * depth / 2, z, f, depth, h, 'trim'); box(x + w / 2 + f / 2, y + face * depth / 2, z, f, depth, h, 'trim')
    box(x, y + face * depth / 2, z + h, w + 2 * f, depth, f, 'trim'); box(x, y + face * (depth / 2 + 0.05), z - 0.14, w + 2 * f + 0.2, depth + 0.1, 0.14, 'trim')
    box(x, y + face * 0.07, z, 0.07, 0.05, h, 'trim'); box(x, y + face * 0.07, z + h * 0.62, w, 0.05, 0.07, 'trim')  # priečky
    if ped == 'tri': prism(x, y + face * 0.32 if face < 0 else y, z + h + f + 0.12, w + 0.9, 0.55, 0.32, 'trim'); box(x, y + face * 0.17, z + h + f, w + 0.9, 0.34, 0.12, 'trim')
    if ped == 'flat': box(x, y + face * 0.17, z + h + f + 0.1, w + 0.8, 0.34, 0.16, 'trim')

def balustrade(x0, x1, y, z, h=1.0):
    """balustráda pozdĺž osi X"""
    L = x1 - x0; cx = (x0 + x1) / 2
    box(cx, y, z, L, 0.3, 0.14, 'trim'); box(cx, y, z + h - 0.14, L, 0.34, 0.14, 'trim')
    n = max(2, round(L / 0.42))
    for i in range(n): cyl(x0 + (i + 0.5) * L / n, y, z + 0.14, 0.085, h - 0.28, 'trim', seg=6)
    for px in (x0, x1): box(px, y, z, 0.42, 0.42, h + 0.08, 'trim')

def column(x, y, z, h, r=0.34):
    box(x, y, z, r * 2.6, r * 2.6, 0.3, 'trim'); cyl(x, y, z + 0.3, r, h - 0.75, 'trim', seg=14, r2=r * 0.86)
    box(x, y, z + h - 0.45, r * 2.3, r * 2.3, 0.2, 'trim'); box(x, y, z + h - 0.25, r * 2.8, r * 2.8, 0.25, 'trim')

W, D = 36.0, 18.0            # celková šírka, hĺbka
F = -D / 2                   # rovina priečelia krídel
CW, CP = 14.0, 2.4           # šírka a predstúpenie stredného rizalitu
FC = F - CP                  # rovina priečelia rizalitu
Z1, Z2, Z3 = 6.4, 16.6, 18.4  # horná hrana prízemia, piana nobile, kladia

# ── hmota ──
box(0, 0, 0, W, D, 0.5, 'stone')
box(0, 0, 0.5, W, D, Z1 - 0.5, 'rustica')
box(0, 0, Z1, W, D, Z2 - Z1, 'plaster')
box(0, F - CP / 2, 0.5, CW, CP, Z1 - 0.5, 'rustica')
for sx in (-1, 1): box(sx * 6.3, F - CP / 2, Z1, 1.4, CP, Z2 - Z1, 'plaster')   # boky rizalitu; stred je otvorená lodžia
box(0, F - 0.6, Z1, 11.2, 1.2, Z2 - Z1, 'plaster')
# bosáž: vodorovné škáry na prízemí
for i in range(1, 9):
    z = 0.5 + i * (Z1 - 0.5) / 9
    for (cx, w, y) in ((-(W + CW) / 4, (W - CW) / 2, F), ((W + CW) / 4, (W - CW) / 2, F), (0, CW, FC)):
        box(cx, y + 0.015, z - 0.04, w + 0.02, 0.03, 0.08, 'stone')
# kordónová rímsa, kladie a korunná rímsa (obiehajú celú budovu)
for (z, h, o, m) in ((Z1 - 0.1, 0.45, 0.22, 'trim'), (Z2, 0.9, 0.08, 'trim'), (Z2 + 0.9, 0.5, 0.2, 'plaster'), (Z2 + 1.4, 0.4, 0.55, 'trim')):
    box(0, 0, z, W + 2 * o, D + 2 * o, h, m)
    box(0, F - CP / 2, z, CW + 2 * o, CP + 2 * o, h, m)

# ── krídla: 3 osi okien, pilastre ──
bay = (W - CW) / 2 / 3
for s in (-1, 1):
    x0 = s * CW / 2
    for i in range(3):
        x = x0 + s * (i + 0.5) * bay
        window(x, F, 1.5, 1.5, 2.0, ped=None)
        window(x, F, 4.3, 1.5, 1.3, ped=None)
        window(x, F, Z1 + 1.9, 1.7, 3.6, ped='tri')
        box(x, F - 0.12, Z1 + 0.9, 2.3, 0.24, 0.8, 'trim')                    # parapetná výplň
        window(x, F, Z1 + 7.4, 1.5, 1.5, ped=None)
    for i in range(4):
        x = x0 + s * i * bay + (s * 0.35 if i == 0 else -s * 0.35 if i == 3 else 0)
        if i == 0: continue
        box(x, F - 0.14, Z1 + 0.35, 0.75, 0.28, Z2 - Z1 - 0.35, 'trim')       # pilaster
        box(x, F - 0.17, Z2 - 0.5, 0.95, 0.34, 0.5, 'trim')                   # hlavica
        box(x, F - 0.17, Z1 + 0.35, 0.95, 0.34, 0.5, 'trim')                  # pätka
    balustrade(x0 + s * 0.4, s * W / 2, F + 0.2, Z3, 1.1) if s > 0 else balustrade(s * W / 2, x0 + s * 0.4, F + 0.2, Z3, 1.1)
    # bočné a zadné priečelie – jednoduché okná
    for j in range(4):
        y = F + (j + 0.5) * D / 4
        for (z, h) in ((1.5, 2.0), (Z1 + 1.9, 3.6), (Z1 + 7.4, 1.5)):
            box(s * (W / 2 + 0.02), y, z, 0.06, 1.5, h, 'glass'); box(s * (W / 2 + 0.06), y, z + h, 0.14, 1.9, 0.16, 'trim'); box(s * (W / 2 + 0.06), y, z - 0.14, 0.14, 1.9, 0.14, 'trim')
for i in range(9):
    x = -W / 2 + (i + 0.5) * W / 9
    for (z, h) in ((1.5, 2.0), (Z1 + 1.9, 3.6)): box(x, D / 2 + 0.02, z, 1.5, 0.06, h, 'glass')
# strecha krídel
box(0, 0.4, Z3, W - 1.6, D - 2.4, 0.9, 'roof'); box(0, 0.6, Z3 + 0.9, W - 5, D - 5.5, 0.8, 'roof')

# ── stredný rizalit: prízemie s portikom ──
PD = 2.6                      # hĺbka portika pred rizalitom
FP = FC - PD
px = [-5.4, -1.8, 1.8, 5.4]   # osi pilierov
box(0, FC - PD / 2, 0, CW - 1.0, PD + 0.6, 0.35, 'stone'); box(0, FP - 0.5, 0, CW - 2.4, 0.9, 0.18, 'stone')
for x in px:
    box(x, FP + 0.45, 0.35, 1.0, 0.9, Z1 - 0.9, 'trim'); box(x, FP + 0.45, Z1 - 1.15, 1.25, 1.05, 0.3, 'trim')
    box(x, FC - 0.1, 0.35, 1.0, 0.25, Z1 - 0.9, 'trim')
for x in (-6.55, 6.55): box(x, FC - PD / 2, 0.35, 0.9, PD, Z1 - 0.9, 'rustica')
box(0, FC - PD / 2, Z1 - 0.85, CW - 0.2, PD + 0.5, 0.75, 'trim')            # preklad a doska balkóna
box(0, FC - PD / 2, Z1 - 0.1, CW + 0.3, PD + 0.9, 0.3, 'trim')
for x in (-3.6, 0, 3.6):                                                    # tri vstupy s oblúkom
    box(x, FC - 0.03, 0.35, 2.3, 0.06, 3.4, 'door'); cyl(x, FC - 0.03, 3.75, 1.15, 0.06, 'glass', seg=20, axis='y')
    box(x, FC - 0.06, 2.3, 2.3, 0.05, 0.1, 'trim'); box(x, FC - 0.06, 0.35, 0.1, 0.05, 3.4, 'trim')
balustrade(-CW / 2 + 0.1, CW / 2 - 0.1, FP - 0.15, Z1 + 0.2, 1.0)
for s in (-1, 1):
    for k in range(6): cyl(s * (CW / 2 - 0.1), FP + 0.2 + k * 0.42, Z1 + 0.34, 0.085, 0.72, 'trim', seg=6)
    box(s * (CW / 2 - 0.1), FC - PD / 2, Z1 + 0.2, 0.3, PD, 0.14, 'trim'); box(s * (CW / 2 - 0.1), FC - PD / 2, Z1 + 1.06, 0.34, PD, 0.14, 'trim')

# ── lodžia na poschodí: stĺpy, tri dvere, medailóny s bustami ──
LZ = Z1 + 0.2
box(0, FC + 0.6, LZ - 0.2, 11.2, 1.2, 0.2, 'stone')                          # podlaha lodžie
for x in (-3.6, 0, 3.6):
    window(x, FC + 1.15, LZ + 0.1, 1.9, 4.2, ped='tri')
    cyl(x, FC + 1.1, LZ + 7.6, 0.95, 0.12, 'trim', seg=20, axis='y'); cyl(x, FC + 1.02, LZ + 7.6, 0.72, 0.1, 'rustica', seg=20, axis='y')
    cyl(x, FC + 0.9, LZ + 7.35, 0.2, 0.22, 'trim', seg=8, axis='y'); ball((x, FC + 0.85, LZ + 7.85), 0.26)
for x in px:
    column(x - 0.42 if abs(x) > 2 else x, FC - 0.5, LZ, Z2 - LZ, 0.36)
    if abs(x) > 2: column(x + 0.42, FC - 0.5, LZ, Z2 - LZ, 0.36)
for s in (-1, 1):
    box(s * 6.3, FC - 0.1, LZ, 1.4, 0.5, Z2 - LZ, 'plaster'); box(s * 6.3, FC - 0.4, LZ, 0.8, 0.3, Z2 - LZ, 'trim')
    cyl(s * 6.3, FC - 0.3, LZ + 7.6, 0.6, 0.12, 'trim', seg=16, axis='y'); cyl(s * 6.3, FC - 0.38, LZ + 7.6, 0.42, 0.1, 'rustica', seg=16, axis='y')
box(0, FC - 0.5, Z2 - 0.02, CW + 0.2, 1.3, 0.92, 'trim'); box(0, FC - 0.55, Z2 + 1.4, CW + 1.2, 1.6, 0.4, 'trim')

# ── atika s nápisom, kupola a súsošie ──
AZ = Z3 + 0.0
box(0, F + 1.9, AZ, CW - 0.6, 8.2, 3.1, 'plaster'); box(0, F + 1.9, AZ + 3.1, CW - 0.1, 8.7, 0.35, 'trim')
box(0, FC + 0.16, AZ + 0.9, 8.6, 0.12, 1.3, 'trim')                          # tabuľa pre nápis (text dopĺňa hra)
for s in (-1, 1):
    box(s * 5.6, FC + 0.17, AZ + 0.7, 1.3, 0.1, 1.5, 'glass'); box(s * 6.4, FC + 0.7, AZ + 3.45, 0.9, 0.9, 0.5, 'trim')
    cyl(s * 6.4, FC + 0.7, AZ + 3.95, 0.22, 1.3, 'bronze', seg=8, r2=0.14); ball((s * 6.4, FC + 0.7, AZ + 5.4), 0.2)
DZ = AZ + 3.45
DY = F + 2.0
dome(0, DY, DZ, 7.0, 4.6, 8.2, 'roof', seg=24, top=0.8)
box(0, DY, DZ + 6.56, 5.4, 3.4, 0.3, 'roof')
for (x, y) in ((-3.1, 0), (3.1, 0), (0, -2.1), (0, 2.1)):                    # zábradlie na vrchole
    box(x * 0.87, DY + y * 0.8, DZ + 6.86, 0.06 if y == 0 else 5.4, 3.4 if y == 0 else 0.06, 0.6, 'bronze')
for s in (-1, 1):                                                           # okrúhle vikiere
    ly = DY - 4.6 * math.sqrt(1 - (3.4 / 7.0) ** 2 - (2.9 / 8.2) ** 2)
    cyl(s * 3.4, ly + 0.1, DZ + 2.9, 0.75, 0.7, 'trim', seg=16, axis='y'); cyl(s * 3.4, ly - 0.26, DZ + 2.9, 0.5, 0.06, 'glass', seg=16, axis='y')
# súsošie múzy Tálie (zjednodušené hmoty)
gy = FC + 1.0
box(0, gy, DZ, 4.4, 1.3, 0.7, 'trim')
cyl(0, gy, DZ + 0.7, 0.42, 2.0, 'bronze', seg=8, r2=0.26); ball((0, gy, DZ + 3.0), 0.3)
for s in (-1, 1):
    cyl(s * 1.35, gy, DZ + 0.7, 0.4, 1.1, 'bronze', seg=8, r2=0.22); ball((s * 1.35, gy, DZ + 2.0), 0.24)
    box(s * 0.75, gy, DZ + 1.9, 1.0, 0.16, 0.16, 'bronze')
box(0, gy, DZ + 3.2, 0.1, 0.1, 1.0, 'bronze')

bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0005)
me = bpy.data.meshes.new('snd'); bm.to_mesh(me); bm.free()
for m in M.values(): me.materials.append(m)
ob = bpy.data.objects.new('snd', me); bpy.context.scene.collection.objects.link(ob)
print('TRIS', sum(len(p.vertices) - 2 for p in me.polygons))

bpy.ops.export_scene.gltf(filepath=args[0], export_format='GLB', export_apply=True, export_normals=True, export_texcoords=False, export_extras=False)

if len(args) > 1:  # náhľad na porovnanie s fotkou
    s = bpy.context.scene
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); s.collection.objects.link(cam); s.camera = cam
    cam.location = (3.5, -52, 4.0); cam.data.lens = 32
    cam.rotation_euler = (Vector((0, F, 13.5)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); s.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(58), 0, math.radians(-28)); sun.data.energy = 3.5
    w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.62, 0.72, 0.85, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.9
    s.render.engine = 'BLENDER_EEVEE_NEXT'; s.render.resolution_x, s.render.resolution_y = 960, 640
    s.render.filepath = args[1]; s.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True)
