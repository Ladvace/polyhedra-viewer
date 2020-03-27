import type Graph from "./Graph"

import Prismatic from "../specs/Prismatic"
import Capstone from "../specs/Capstone"

function getCapTypes(base: 3 | 4 | 5): Capstone["data"]["type"][] {
  if (base === 5) {
    return ["cupola", "rotunda"]
  }
  return ["cupola"]
}

export default function capstoneGraph(g: Graph) {
  for (const prismatic of Prismatic.getAll()) {
    const { base, type } = prismatic.data

    // Prisms can be turned into antiprisms
    if (prismatic.isPrism()) {
      g.addEdge("turn", prismatic, prismatic.withData({ type: "antiprism" }))
    }
    if (base <= 5) {
      g.addEdge(
        "augment",
        prismatic,
        Capstone.query.withData({
          type: "pyramid",
          count: 1,
          elongation: type,
          base: base as any,
        }),
      )
    } else {
      for (const capType of getCapTypes((base / 2) as any)) {
        g.addEdge(
          "augment",
          prismatic,
          Capstone.query.withData({
            type: capType,
            count: 1,
            elongation: type,
            base: (base / 2) as any,
          }),
        )
      }
    }
  }
  // TODO handle cases where the item doesn't exist
  for (const cap of Capstone.getAll()) {
    const { base, type, count, elongation } = cap.data
    if (cap.isMono()) {
      if (cap.isPyramid()) {
        g.addEdge("augment", cap, cap.withData({ count: 2 }))
      } else {
        const bis = Capstone.query.where((data) => {
          return (
            [type, "cupolarotunda"].includes(data.type) &&
            base === data.base &&
            elongation === data.elongation &&
            count === 2
          )
        })
        // const bis = Capstone.query.where({ base, type, elongation, count: 2 })
        for (const bi of bis) {
          // TODO handle cupola-rotunda
          g.addEdge("augment", cap, bi)
        }
      }
    }

    // Elongate/gyroelongate if not already elongated
    if (cap.isShortened()) {
      g.addEdge("elongate", cap, cap.withData({ elongation: "prism" }))

      g.addEdge("gyroelongate", cap, cap.withData({ elongation: "antiprism" }))
    }
    // Elongated caps can be *twisted* to gyroelongated caps
    if (cap.isElongated()) {
      g.addEdge("twist", cap, cap.withData({ elongation: "antiprism" }))
    }

    // Gyrate between ortho and gyro cupolae
    if (cap.isBi() && !cap.isPyramid() && cap.data.gyrate !== "gyro") {
      if (cap.isGyroelongated()) {
        // Gyroelongated capstones gyrate to themselves
        g.addEdge("gyrate", cap, cap)
      } else {
        // Ortho-capstones gyrate to gyro-capstones
        g.addEdge("gyrate", cap, cap.withData({ gyrate: "gyro" }))
      }
    }
  }
}
