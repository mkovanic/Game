# Spoločné pomôcky na procedurálne modelovanie budov v Blenderi (bmesh): kvádre, valce, okná, balustrády…
# Os: priečelie smeruje k -Y (v glTF +Z), Z je hore. Použitie: from lib import *; palette({...}); …; finish('meno', args, cam, look)
import bpy, bmesh, sys, math
from mathutils import Vector, Matrix

args = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bm = bmesh.new()
M, MI = {}, {}

def material(name, rgb, rough=0.85, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*[((c / 255) ** 2.2) for c in rgb], 1)
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    m.diffuse_color = (*[c / 255 for c in rgb], 1)
    return m


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


def palette(cols):
    """cols: meno -> (r, g, b) alebo ((r, g, b), drsnosť, kovovosť)"""
    for k, v in cols.items():
        M[k] = material(k, *v) if isinstance(v[0], tuple) else material(k, v)
        MI[k] = len(MI)

def finish(name, cam=(3.5, -52, 4.0), look=(0, -9, 13.5), lens=32):
    """zapíše GLB (args[0]) a voliteľne náhľad (args[1])"""
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0005)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in M.values(): me.materials.append(m)
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    print('TRIS', sum(len(p.vertices) - 2 for p in me.polygons))
    bpy.ops.export_scene.gltf(filepath=args[0], export_format='GLB', export_apply=True, export_normals=True, export_texcoords=False, export_extras=False)
    if len(args) > 1:
        s = bpy.context.scene
        c = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); s.collection.objects.link(c); s.camera = c
        c.location = cam; c.data.lens = lens; c.data.clip_end = 500
        c.rotation_euler = (Vector(look) - c.location).to_track_quat('-Z', 'Y').to_euler()
        sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); s.collection.objects.link(sun)
        sun.rotation_euler = (math.radians(58), 0, math.radians(-28)); sun.data.energy = 3.5
        w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True
        w.node_tree.nodes['Background'].inputs[0].default_value = (0.62, 0.72, 0.85, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.9
        s.render.engine = 'BLENDER_EEVEE_NEXT'; s.render.resolution_x, s.render.resolution_y = 960, 640
        s.render.filepath = args[1]; s.render.image_settings.file_format = 'PNG'
        bpy.ops.render.render(write_still=True)
