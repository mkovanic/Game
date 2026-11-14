# Konverzia postáv Microsoft Rocketbox (MIT) do GLB pre hru.
#   blender -b -P tools/convert.py -- model <cesta/Meno.fbx> <out.glb> [atlas_px=1024]
#   blender -b -P tools/convert.py -- anim  <cesta/anim.max.fbx> <out.glb> <meno_klipu>
# Model: telo + hlava + vlasy (opacity) sa zložia do jedného atlasu (šírka 1,5 × výška):
#   ľavá časť = telo (S×S), vpravo stĺpce po S/2: hlava, vlasy/riasy (alfa), výstroj. Jeden materiál, alphaTest.
# Animácia: len skelet, bez prstov a tváre, 15 fps.
import bpy, sys, os, glob, numpy as np

a = sys.argv[sys.argv.index('--') + 1:]
mode, src, out = a[0], a[1], a[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=src)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
for o in list(bpy.data.objects):
    if o.type not in ('ARMATURE', 'MESH'): bpy.data.objects.remove(o)

def load(path, size):
    im = bpy.data.images.load(path)
    if tuple(im.size) != (size, size): im.scale(size, size)
    px = np.empty(size * size * 4, np.float32); im.pixels.foreach_get(px)
    px = px.reshape(size, size, 4)
    bpy.data.images.remove(im)
    return px

if mode == 'model':
    S = int(a[3]) if len(a) > 3 else 1024
    H = S // 2
    mesh = next(o for o in bpy.data.objects if o.type == 'MESH')
    for ac in list(bpy.data.actions): bpy.data.actions.remove(ac)
    arm.animation_data_clear()
    tex = os.path.join(os.path.dirname(os.path.dirname(src)), 'Textures')
    def find(name):
        f = (glob.glob(os.path.join(tex, name + '_color*.tga')) or [''])[0]
        if os.path.exists(f): return f
        pre, key = name.rsplit('_', 1)  # napr. m172_equpiment (preklep v zdroji) -> m172_equipment_color.tga
        c = glob.glob(os.path.join(tex, f'{pre}_{key[:3]}*_color.tga')) or glob.glob(os.path.join(tex, f'*_{key[:3]}*_color.tga'))
        return c[0]
    mats = [m.name for m in mesh.data.materials]
    body = next(i for i, n in enumerate(mats) if 'body' in n.lower())
    rank = lambda n: 0 if 'head' in n.lower() else 1 if 'opacity' in n.lower() else 2
    extra = sorted((i for i in range(len(mats)) if i != body), key=lambda i: rank(mats[i]))
    W = S + H * ((len(extra) + 1) // 2)
    atlas = np.ones((S, W, 4), np.float32)
    atlas[:, :S] = load(find(mats[body]), S); atlas[:, :S, 3] = 1
    if len(a) > 4 and a[4] == 'olive':  # digitálny maskáč -> jednofarebná olivová (koža rúk ostáva)
        b = atlas[:, :S]; r, g, bl = b[..., 0], b[..., 1], b[..., 2]
        skin = (r > g * 1.08) & (g > bl) & (r - bl > 0.12)
        L = 0.3 * r + 0.59 * g + 0.11 * bl
        col = np.array([0.30, 0.33, 0.21]) * (0.45 + 1.1 * L)[..., None]
        b[..., :3] = np.where(skin[..., None], b[..., :3], np.clip(col, 0, 1))
    reg = {body: (0, 0, S / W, 1)}  # index materiálu -> (u0, v0, su, sv)
    for k, i in enumerate(extra):
        x, y = S + H * (k // 2), H * (1 - k % 2)  # vpravo hore hlava, pod ňou vlasy/výstroj
        atlas[y:y + H, x:x + H] = load(find(mats[i]), H)
        if 'opacity' not in mats[i].lower(): atlas[y:y + H, x:x + H, 3] = 1
        reg[i] = (x / W, y / S, H / W, 0.5)
    img = bpy.data.images.new('atlas', W, S, alpha=True)
    img.pixels.foreach_set(atlas.ravel())
    uv = mesh.data.uv_layers.active.data
    for p in mesh.data.polygons:
        u0, v0, su, sv = reg[p.material_index]
        for li in p.loop_indices:
            u, v = uv[li].uv
            u, v = min(max(u, 0.001), 0.999), min(max(v, 0.001), 0.999)
            uv[li].uv = (u0 + u * su, v0 + v * sv)
        p.material_index = 0
    mat = bpy.data.materials.new('skin'); mat.use_nodes = True
    nt = mat.node_tree; bsdf = nt.nodes['Principled BSDF']
    ti = nt.nodes.new('ShaderNodeTexImage'); ti.image = img
    nt.links.new(ti.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(ti.outputs['Alpha'], bsdf.inputs['Alpha'])
    bsdf.inputs['Roughness'].default_value = 0.85
    mat.blend_method = 'CLIP' if hasattr(mat, 'blend_method') else None
    mesh.data.materials.clear(); mesh.data.materials.append(mat)
    mesh.name = 'body'
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=False, export_morph=False,
                              export_image_format='WEBP', export_image_quality=82, export_skins=True,
                              export_def_bones=True, export_tangents=False, export_extras=False)
else:
    clip = a[3]
    drop = ('Finger', 'Eye', 'Jaw', 'Lip', 'Tongue', 'Mouth', 'Masseter', 'Caninus', 'Cheek', 'brow', 'Nose', 'Footsteps')
    for o in list(bpy.data.objects):
        if o != arm: bpy.data.objects.remove(o)
    act = arm.animation_data.action
    for fc in list(act.fcurves):
        if any(d in fc.data_path for d in drop): act.fcurves.remove(fc)
    act.name = clip
    for ac in list(bpy.data.actions):
        if ac != act: bpy.data.actions.remove(ac)
    s = bpy.context.scene; s.frame_start, s.frame_end = int(act.frame_range[0]), int(act.frame_range[1])
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=True, export_frame_step=2,
                              export_force_sampling=True, export_anim_single_armature=True, export_def_bones=False,
                              export_animation_mode='ACTIVE_ACTIONS', export_optimize_animation_size=True,
                              export_morph=False, export_extras=False)
print('OK', out, os.path.getsize(out))
