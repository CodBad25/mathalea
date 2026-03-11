import type * as THREEType from 'three'
import type { Object3D } from 'three'
import * as THREE from 'three'

import {
  BufferGeometryUtils,
  LineMaterial,
  LineSegmentsGeometry,
  OrbitControls,
  Wireframe,
} from 'three/examples/jsm/Addons.js'
export { Text } from 'troika-three-text'

const BoxGeometry = THREE.BoxGeometry
const Mesh = THREE.Mesh
const MeshPhongMaterial = THREE.MeshPhongMaterial

const EdgesGeometry = THREE.EdgesGeometry
type Object3DJSON = THREEType.Object3DJSON

export {
  BoxGeometry,
  BufferGeometryUtils,
  EdgesGeometry,
  LineMaterial,
  LineSegmentsGeometry,
  Mesh,
  MeshPhongMaterial,
  OrbitControls,
  THREE,
  Wireframe,
  type Object3D,
  type Object3DJSON,
  type THREEType,
}
