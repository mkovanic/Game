#!/bin/bash
# Konverzia postáv a animácií Rocketbox -> assets/people (potrebuje Blender a sparse checkout Rocketboxu).
#   RB=~/rbwork/rb tools/people.sh
set -e
B=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
RB=${RB:-~/rbwork/rb}; TMP=$(mktemp -d); OUT=assets/people; mkdir -p $OUT
NPC="Business_Female_03 Police_Male_03 Female_Adult_04 Male_Adult_12 Business_Male_03 Male_Adult_07 Male_Adult_03 Construction_Male_02 Female_Adult_15 Military_Male_05 Female_Adult_14"
CROWD="Construction_Male_03 Male_Adult_04 Male_Adult_13 Business_Male_02 Female_Adult_09 Female_Adult_11 Business_Female_02"
for m in $NPC $CROWD; do
  px=1024; [[ " $CROWD " == *" $m "* ]] && px=512
  f=$(find $RB/Assets/Avatars -name "$m.fbx" -path "*/Export/*")
  rc=; [ $m = Military_Male_05 ] && rc=olive
  $B -b -P tools/convert.py -- model "$f" $TMP/$m.glb $px $rc >/dev/null 2>&1
  node tools/pack.mjs model $TMP/$m.glb $OUT/$m.glb >/dev/null; echo "$m $(stat -f%z $OUT/$m.glb)"
done
A=$RB/Assets/Animations
for g in m f; do
  for c in idle:idle_neutral_01 idle2:idle_look_around_01 idle3:idle_neutral_02 talk:gestic_talk_neutral_01 listen:gestic_listen_neutral_01 clap:claphands_01 crouch:crouch_idle walk:walk_neutral; do
    n=${c%%:*}; f=$(ls $A/*/${g}_${c#*:}.max.fbx)
    $B -b -P tools/convert.py -- anim "$f" $TMP/$g-$n.glb $n >/dev/null 2>&1
    node tools/pack.mjs anim $TMP/$g-$n.glb $OUT/$g-$n.glb >/dev/null; echo "$g-$n $(stat -f%z $OUT/$g-$n.glb)"
  done
done
