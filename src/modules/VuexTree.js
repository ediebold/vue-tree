import Vue from 'vue';

function updateNode(state, nodeID, newData) {
  Vue.set(state.nodes, nodeID, Object.assign({}, state.nodes[nodeID], newData));
}

function updateAncestorRecursiveField(state, nodeID, field) {
  // Update status of ancestors
  let node = {parent: nodeID};
  while (node.parent != null) {
    node = state.nodes[node.parent];
    if (node.children.length == 0) continue;
    // Calculate new status based on children
    let childrenVal = null;
    for (let childID of node.children) {
      let child = state.nodes[childID]
      if (child[field] != childrenVal && childrenVal != null) {
        childrenVal = state.recursiveFields[field];
        break;
      } else if (childrenVal == null) {
        childrenVal = child[field];
      }
    }
    // If status has changed, set new status and continue,
    // else, we can stop bubbling up.
    if (childrenVal != node[field]) {
      updateNode(state, node.id, { [field]: childrenVal });
    } else {
      break;
    }
  }
}

function updateAncestorAllRecursiveFields(state, nodeID) {
  for (let pair of Object.entries(state.recursiveFields)) {
    updateAncestorRecursiveField(state, nodeID, pair[0]);
  }
}

function updateRecursiveField(state, nodeID, field, newValue) {
  let editList = [nodeID];
  while (editList.length > 0) {
    let node = state.nodes[editList.pop()];
    // If we don't need to change anything, we can
    // stop navigating down this branch.
    if (node[field] !== newValue) {
      updateNode(state, node.id, { [field]: newValue });
      editList = editList.concat(node.children);
    }
  }
  updateAncestorRecursiveField(state, nodeID, field)
}

export default {
  namespaced: true,
  state() { 
    return {
      nodes: {}, // id -> node data
      recursiveFields: {
        "selected": false,
        "checked": "indet"
      },
      trackedNodeFields: ["text", "icon", "previousSibling", "parent"],
      currentScene: "",
      ignoreGlobalScenes: true,
      scenes: {}, // id -> list of on nodes
      rootNodes: [],
      allowedChildrenCheck: null, // validation function
      newIDCount: 0,
    }; 
  },
  mutations: {
    // A previous of 'undefined' means "slot me at the end". "null" means to put first.
    addNodes(state, rawNodes) {
      // Mostly atomic
      // Order is irrelevant except where two nodes have the same previously (including undefined).
      // These nodes will be added to the tree in order of discovery.
      let newIDCount = 0;
      let nodes = [];
      let nodesNoPrevious = []; // Used to ensure those without previous are all at the end of the insert.
      let newNodeIDs = [] // Used to veritfy tree structure later.

      // First pass - simply set up all nodes in correct format, don't worry about tree integrity yet.
      for (let rawNode of rawNodes) {
        let node = {};
        // Inform the user that we will be overwriting a node that already exists
        if (rawNode.id !== undefined && state.nodes[rawNode.id]) {
          console.log("Tree Warning. A nodeState with id " + rawNode.id + " already exists. It will be overwritten.");
        }
        node.id = rawNode.id || "t" + (state.newIDCount + newIDCount);
        node.id = node.id.toString();
        newNodeIDs.push(node.id);
        newIDCount++;
        node.parent = rawNode.parent || null;
        if (node.parent !== null) {
          node.parent = node.parent.toString();
        }
        node.previousSibling = rawNode.previousSibling;
        if (node.previousSibling != null && node.previousSibling !== undefined) {
          node.previousSibling = node.previousSibling.toString();
        }
        // For simplicity's sake, these values are purged from input
        // and calculated in the tree to allow simple insertion.
        node.children = [];
        node.nextSibling = null;

        for (let pair of Object.entries(state.recursiveFields)) {
          node[pair[0]] = rawNode[pair[0]] || false;
        }
        for (let field of state.trackedNodeFields) {
          if (node[field] !== undefined) continue;
          if (field == "parent" || field == "previousSibling" || field == "nextsibling" || field == "children") continue;
          node[field] = rawNode[field] || null;
        }
        // Place in correct spot in array to avoid ordering issues later.
        if (node.previousSibling === undefined) {
          nodesNoPrevious.push(node);
        } else {
          nodes.push(node);
        }
      }

      // Organise nodes into correct order
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.previousSibling == null) continue;
        let prevIndex = nodes.findIndex(tnode => tnode.id == node.previousSibling);
        if (prevIndex > i) {
          nodes.splice(i, 1);
          nodes.splice(prevIndex, 0, node);
          i--;
        }
      }
      nodes = nodes.concat(nodesNoPrevious);
      
      // Second pass - verify tree integrity and create links where necessary
      let childrenLists = {};
      let newPreviousLinks = {};
      let newNextLinks = {};
      let oldNodeIDs = Object.keys(state.nodes);
      let errors = false;
      for (let node of nodes) {
        // Set up parent's reference to node
        let parentID = node.parent == null ? "__root" : node.parent;
        // Error if the parent doesn't exist
        if (parentID != "__root" && !oldNodeIDs.includes(parentID) && !newNodeIDs.includes(parentID)) {
          console.error("Tree Error. " + node.id + " has " + parentID + " as a parent, but that node does not exist.");
          errors = true;
        }
        // Add to collection of children lists if not already provided
        if (!childrenLists.hasOwnProperty(parentID)) {
          // Clone if from an existing array
          if (parentID == "__root") {
            childrenLists["__root"] = state.rootNodes.slice(0);
          } else if (state.nodes.hasOwnProperty(parentID)) {
            childrenLists[parentID] = state.nodes[parentID].children.slice(0);
          } else {
            childrenLists[parentID] = [];
          }
        }
        let prevIndex = -1;
        if (node.previousSibling === undefined) {
          prevIndex = childrenLists[parentID].length;
        } else if (node.previousSibling != null) {
          prevIndex = childrenLists[parentID].indexOf(node.previousSibling);
          if (prevIndex == -1) {
            console.error("Tree Error. " + node.id + " has " + node.previousSibling + " as a previous sibling, but that node does not have the same parent.");
            errors = true;
          }
        }
        // Set up changes to siblings (including all nexts for applicable new nodes)
        if (node.previousSibling === undefined) {
          if (childrenLists[parentID].length == 0) {
            node.previousSibling = null;
          } else {
            node.previousSibling = childrenLists[parentID][childrenLists[parentID].length - 1];
          }
        }
        let previous = node.previousSibling == null ? null : state.nodes[node.previousSibling];
        if (previous === undefined) {
          previous = nodes.find(tNode => tNode.id == node.previousSibling);
        }
        if (previous != null) {
          if (previous.parent != node.parent) {
            console.error("Tree Error. " + node.id + " has " + node.previousSibling + " as a previous sibling, but that node does not have the same parent.");
            errors = true;
          }
          if (previous.nextSibling != null) {
            if (newPreviousLinks.hasOwnProperty(previous.nextSibling)) {
              console.error("Tree Error. " + previous.nextSibling + " appears before two nodeStates.");
              errors = true;
            }
            if (newNextLinks.hasOwnProperty(node.id)) {
              console.error("Tree Error. " + node.id + " appears after two nodes.");
              errors = true;
            }
            newPreviousLinks[previous.nextSibling] = node.id;
            newNextLinks[node.id] = previous.nextSibling;
          }
          if (newNextLinks.hasOwnProperty(node.previousSibling)) {
            console.error("Tree Error. " + node.previousSibling + " appears after two nodes.");
            errors = true;
          }
          newNextLinks[node.previousSibling] = node.id;
        } else {
          if (childrenLists[parentID].length > 0) {
            let first = childrenLists[parentID][0];
            newPreviousLinks[first] = node.id;
            newNextLinks[node.id] = first;
          }
        }
        childrenLists[parentID].splice(prevIndex + 1, 0, node.id);
      }
      // Bail out if we encountered any errors.
      if (errors) return;
      
      // Now, actually edit tree.
      state.newIDCount = state.newIDCount + newIDCount;
      for (let node of nodes) {
        Vue.set(state.nodes, node.id, node);
      }
      for (let pair of Object.entries(childrenLists)) {
        if (pair[0] == "__root") {
          state.rootNodes = pair[1];
          continue;
        }
        updateNode(state, pair[0], { children: pair[1] });
      }
      for (let pair of Object.entries(newPreviousLinks)) {
        updateNode(state, pair[0], { previousSibling: pair[1] });
      }
      for (let pair of Object.entries(newNextLinks)) {
        updateNode(state, pair[0], { nextSibling: pair[1] });
      }
      for (let node of nodes) {
        updateAncestorAllRecursiveFields(state, node.id);
      }
    },
    //TODO: single check.
    editNodeField(state, {nodeID, field, newValue}) {
      // Recursive fields.
      if (state.recursiveFields.hasOwnProperty(field)) {
        updateRecursiveField(state, nodeID, field, newValue)
      // Single fields
      } else {
        updateNode(state, nodeID, { [field]: newValue });
      }
    },
    deleteNode(state, {nodeID}) {
      let node = state.nodes[nodeID];
      // Delete all descendants
      let deleteList = [];
      let checkList = [nodeID];
      while (checkList.length > 0) {
        let tempNode = state.nodes[checkList.pop()];
        deleteList = deleteList.concat(tempNode.id);
        if (tempNode.children.length > 0) {
          checkList = checkList.concat(tempNode.children);
        }
      }
      for (let tempNode of deleteList) {
        Vue.delete(state.nodes, tempNode);
      }
      // Update references of adjacent siblings
      if (node.previousSibling != null) {
        let prev = state.nodes[node.previousSibling];
        prev.nextSibling = node.nextSibling;
      }
      if (node.nextSibling != null) {
        let next = state.nodes[node.nextSibling];
        next.previousSibling = node.previousSibling;
      }
      // Update parent reference
      if (node.parent != null) {
        let parentNodeChildren = state.nodes[node.parent].children;
        let index = parentNodeChildren.indexOf(nodeID);
        parentNodeChildren.splice(index, 1);
      // Remove from rootNodes
      } else {
        let index = state.rootNodes.indexOf(nodeID);
        state.rootNodes.splice(index, 1);
      }
      Vue.delete(state.nodes, nodeID);
    },
    moveNode(state, {nodeID, newParentID, newPreviousID}) {
      let node = state.nodes[nodeID];
      let newParent = newParentID == null ? {children: state.rootNodes} : state.nodes[newParentID];
      // If newPreviousID is undefined, we add it to the end of the siblings
      if (newPreviousID === undefined) {
        if (newParent.children.length == 0) {
          newPreviousID = null;
        } else {
          newPreviousID = newParent.children[newParent.children.length - 1]
        }
      }
      let newPrevious = newPreviousID == null ? null : state.nodes[newPreviousID];
      // Remove from old sibling list if necessary
      if (node.previousSibling != null) {
        updateNode(state, node.previousSibling, { nextSibling: node.nextSibling });
      }
      if (node.nextSibling != null) {
        updateNode(state, node.nextSibling, { previousSibling: node.previousSibling });
      }
      //Remove from old parent list
      let oldParentID = node.parent;
      if (oldParentID != null) {
        let parentNodeChildren = state.nodes[oldParentID].children;
        let index = parentNodeChildren.indexOf(nodeID);
        parentNodeChildren.splice(index, 1);
      // Remove from rootNodes
      } else {
        let index = state.rootNodes.indexOf(nodeID);
        state.rootNodes.splice(index, 1);
      }
      // Add into new sibling list if necessary
      let newNext;
      if (newPrevious != null) {
        if (newPrevious.nextSibling != null) {
          newNext = state.nodes[newPrevious.nextSibling];
          newNext.previousSibling = nodeID;
        }
        newPrevious.nextSibling = nodeID;
      } else if (newParentID == null) {
        updateNode(state, state.rootNodes[0], { previousSibling: nodeID });
      } else if (newParent.children.length > 0) {
        updateNode(state, newParent.children[0], { previousSibling: nodeID });
      }
      let newNextID = newNext == null ? null : newNext.id;
      // Add to new parent list
      if (newParentID != null) {
        let newParentNodeChildren = newParent.children;
        let index = newParentNodeChildren.indexOf(newPreviousID) + 1;
        newParentNodeChildren.splice(index, 0, nodeID);
      // Add to rootNodes
      } else {
        let index = state.rootNodes.indexOf(newPreviousID) + 1;
        state.rootNodes.splice(index, 0, nodeID);
      }
      // Update nodeID's references
      updateNode(state, nodeID, { 
        previousSibling: newPreviousID,
        nextSibling: newNextID,
        parent: newParentID,
      });

      // Update new and old ancestors
      updateAncestorAllRecursiveFields(state, newParentID)
      updateAncestorAllRecursiveFields(state, oldParentID)
    },
    setAllowedChildrenCheck(state, newValue) {
      state.allowedChildrenCheck = newValue;
    },
    setIgnoreGlobalScenes(state, newValue) {
      state.ignoreGlobalScenes = newValue;
    },
    saveCurrentAsScene(state, sceneName) {
      let newScene = [];
      for (let node of Object.values(state.nodes)) {
        if (node.checked === true && node.children.length == 0) {
          newScene.push(node.id);
        }
      }
      Vue.set(state.scenes, sceneName, newScene);
    },
    switchToScene(state, sceneName) {
      if(state.scenes[sceneName] === undefined) {
        console.error("Scene " + sceneName + " could not be found.");
        return;
      }
      let goalScene = state.scenes[sceneName];
      for (let node of Object.values(state.nodes)) {
        if (goalScene.includes(node.id) || goalScene.includes(Number(node.id))) {
          updateNode(state, node.id, { checked: true });
          updateAncestorAllRecursiveFields(state, node.id);
        } else {
          updateNode(state, node.id, { checked: false });
          updateAncestorAllRecursiveFields(state, node.id);
        }
      }
    },
    addScene(state, {sceneName, sceneNodes}) {
      Vue.set(state.scenes, sceneName, sceneNodes);
    },
    clear(state) {
      state.nodes = {};
      state.currentScene = "";
      state.scenes = {};
      state.rootNodes = [];
      state.newIDCount = 0;
    }
  },
  getters: {
    getCheckedNodes (state) {
      return Object.values(state.nodes).filter(node => node.checked === true);
    },
    getSelectedNodes (state) {
      return Object.values(state.nodes).filter(node => node.selected);
    },
    getRootNodes (state) {
      return state.rootNodes;
    },
    getNodes (state) {
      return state.nodes;
    },
    getNodesArray (state) {
      return Object.values(state.nodes);
    },
    getNode: (state) => (id) => {
      return state.nodes[id];
    },
    getNodeChildren: (state) => (id) => {
      // Return root nodes if id == null
      if (id == null) {
        let rootNodes = []
        for (let rootID of state.rootNodes) {
          rootNodes.push(state.nodes[rootID]);
        };
        return rootNodes;
      }
      let children = []
      for (let childID of state.nodes[id].children) {
        children.push(state.nodes[childID]);
      };
      return children;
    },
    getAllLeaves (state) {
      return Object.values(state.nodes).filter(node => node.children.length === 0);
    },
    getLeaves: (state) => (id) => {
      let leaves = [];
      let checkChildren;
      if (id == null) {
        checkChildren = state.rootNodes.slice(0);
      } else {
        checkChildren = state.nodes[id].children.slice(0);
      }
      let curNodeChildren = [];
      if (checkChildren.length < 1) return [id];
      while (checkChildren.length > 0) {
        let curNode = checkChildren.pop();
        curNodeChildren = state.nodes[curNode].children;
        if (curNodeChildren.length == 0) {
          leaves.push(curNode);
        } else {
          checkChildren = checkChildren.concat(curNodeChildren);
        }
      }
      return leaves;
    },
    getAncestors: (state) => (id) => {
      let node = state.nodes[id];
      if (node.parent == null) {
        return []
      }
      let ancestors = [];
      while (node.parent != null) {
        ancestors.push(node.parent);
        node = state.nodes[node.parent];
      }
      return ancestors;
    },
    getSceneNames(state) {
      return Object.keys(state.scenes);
    },
    getScene: (state) => (sceneName) => {
      return state.scenes[sceneName];
    }
  },
  actions: {
    saveCurrentAsScene: {
      root: true,
      handler(context, sceneName) {
        if (context.state.ignoreGlobalScenes) return;
        context.commit('saveCurrentAsScene', sceneName)
      }
    },
    switchToScene: {
      root: true,
      handler(context, sceneName) {
        if (context.state.ignoreGlobalScenes) return;
        context.commit('switchToScene', sceneName)
      }
    },
  }
}