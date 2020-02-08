import { withOrigin } from 'math/geom';
import { apothem } from 'math/polygons';
import { Polyhedron, Cap, VEList, Edge } from 'math/polyhedra';
import makeOperation from '../makeOperation';
import { getTransformedVertices } from '../operationUtils';
import { antiprismHeight } from '../prismOps/prismUtils';
import {
  everyOtherEdge,
  hasAntiprism,
  getVertexFunction,
} from './lateralUtils';

function calculateScale(base: VEList) {
  const resApothem = apothem(base.numSides / 2, base.sideLength());
  return base.apothem() - resApothem;
}

function doAntiprismCompress(polyhedron: Polyhedron) {
  const caps = Cap.getAll(polyhedron);
  let bases: VEList[];
  let edges: Edge[];
  let edges2: Edge[];
  let isReverse = false;
  switch (caps.length) {
    // Prism, our bases are our largest faces
    case 0:
      bases = polyhedron.facesWithNumSides(polyhedron.largestFace().numSides);
      edges = bases[0].edges.filter((e, i) => i % 2 === 0);
      edges2 = everyOtherEdge(
        edges[0]
          .twin()
          .next()
          .twin()
          .prev()
          .twin(),
      );
      break;
    // gyroelongated cupola
    case 1:
      bases = [caps[0].boundary(), polyhedron.largestFace()];
      edges = bases[0].edges.filter(e => e.face.numSides === 3);
      edges2 = everyOtherEdge(
        edges[0]
          .twin()
          .next()
          .twin()
          .prev()
          .twin(),
      );
      break;
    case 2:
      bases = caps.map(c => c.boundary());
      edges = bases[0].edges.filter(e => e.face.numSides === 3);
      edges2 = bases[1].edges.filter(e => e.face.numSides === 3);
      isReverse =
        edges[0]
          .twin()
          .next()
          .twin()
          .prev()
          .twinFace().numSides !== 3;
      break;
    default:
      throw new Error('Invalid number of capstones');
  }
  const [base, base2] = bases;
  const n = base.numSides;
  const horizScale = calculateScale(base);
  const vertScale =
    (base.sideLength() * (antiprismHeight(n) - antiprismHeight(n / 2))) / 2;
  const angle = (Math.PI / n / 2) * (isReverse ? -1 : 1);

  const compressSets = [
    ...edges.map(e => ({
      dirVec: base
        .centroid()
        .sub(e.midpoint())
        .getNormalized(),
      base,
      vertices: e.face.numSides === 3 ? e.face.vertices : e.vertices,
      polyhedron,
    })),
    ...edges2.map(e => ({
      dirVec: base2
        .centroid()
        .sub(e.midpoint())
        .getNormalized(),
      base: base2,
      vertices: e.face.numSides === 3 ? e.face.vertices : e.vertices,
      polyhedron,
    })),
  ];
  const endVertices = getTransformedVertices(compressSets, ({ base, dirVec }) =>
    withOrigin(base.normalRay(), v =>
      v
        .add(dirVec.scale(horizScale))
        .sub(base.normal().scale(vertScale))
        .getRotatedAroundAxis(base.normal(), angle),
    ),
  );
  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}

function doCompress(polyhedron: Polyhedron) {
  let base: VEList, edges: Edge[];

  const caps = Cap.getAll(polyhedron);
  if (caps.length === 0) {
    // If we don't have access to a cupola (i.e., we are a prism)
    // Use the largest face as a base and just pick every other edge
    base = polyhedron.largestFace();
    edges = base.edges.filter((_, i) => i % 2 === 0);
  } else if (caps[0].type === 'pyramid') {
    // If we are an augmented prism, use the largest face and make sure
    // the augmentee is one of the edges
    base = polyhedron.largestFace();
    edges = everyOtherEdge(base.edges.find(e => e.twinFace().numSides === 3)!);
  } else {
    // If we are a cupola, use the cupola boundary as a base
    // and pick the edges adjacent to triangles, since those are the ones
    // that need to get compressed
    base = caps[0].boundary();
    edges = base.edges.filter(e => e.face.numSides === 3);
  }

  // Determine the facets that need to be pushed in, depending on what kind of polyhedron
  // we are dealing with
  const vertexFunc = getVertexFunction(polyhedron);
  const compressSets = edges.map(e => ({
    dirVec: base
      .centroid()
      .sub(e.midpoint())
      .getNormalized(),
    vertices: vertexFunc(e),
    polyhedron,
  }));

  // How far each facet needs to be pushed in
  const scale = calculateScale(base);

  // Push the vertices in and return the updated data
  const endVertices = getTransformedVertices(compressSets, ({ dirVec }) => v =>
    v.add(dirVec.scale(scale)),
  );
  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}

export const compress = makeOperation('compress', {
  apply(polyhedron) {
    return hasAntiprism(polyhedron)
      ? doAntiprismCompress(polyhedron)
      : doCompress(polyhedron);
  },
});
