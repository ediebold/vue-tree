import Vue from 'vue';

function updateAncestorCheck(state, nodeID) {
  let node = {parent: nodeID};
  while (node.parent != null) {
    node = state.nodes[node.parent];
    let originalCheck = node.checked;
    // Calculate new status based on children
    let childrenCheck = null;
    for (let childID of node.children) {
      let child = state.nodes[childID]
      if (child.checked != childrenCheck && childrenCheck != null) {
        childrenCheck = "indet";
        break;
      } else if (childrenCheck == null) {
        childrenCheck = child.checked;
      }
    }
    // If status has changed, set new status and continue,
    // else, we can stop bubbling up.
    if (childrenCheck != originalCheck) {
      node.checked = childrenCheck;
    } else {
      break;
    }
  }
}

function updateAncestorSelect(state, nodeID) {
  let node = {parent: nodeID};
  while (node.parent != null) {
    node = state.nodes[node.parent];
    let originalSelect = node.selected;
    // Calculate new status based on children
    let childrenSelect = null;
    for (let childID of node.children) {
      let child = state.nodes[childID]
      if (child.selected != childrenSelect && childrenSelect != null) {
        childrenSelect = false;
        break;
      } else if (childrenSelect == null) {
        childrenSelect = child.selected;
      }
    }
    // If status has changed, set new status and continue,
    // else, we can stop bubbling up.
    if (childrenSelect != originalSelect) {
      node.selected = childrenSelect;
    } else {
      break;
    }
  }
}

export default {
  namespaced: true,
  state () { 
    return {
      nodes: {},
      singleCheckOnly: false,
      separateSelection: true,
      newIDCount: 0,
      allowedChildrenCheck: null,
      rootNodes: [],
      treestates: {},
    }
  },
  mutations: {
    addNodes(state, rawNodes) {
      // Mostly atomic (hopefully.)
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
          console.log("Tree Warning. A node with id " + rawNode.id + " already exists. It will be overwritten.");
        }
        node.id = rawNode.id || "t" + (state.newIDCount + newIDCount);
        node.id = node.id.toString();
        newNodeIDs.push(node.id);
        newIDCount++;

        node.text = rawNode.text || "New Node" + node.id;
        node.icon = rawNode.icon || "";
        node.link = rawNode.link || null;
        node.parent = rawNode.parent || null;
        if (node.parent !== null) {
          node.parent = node.parent.toString();
        }
        node.previousSibling = rawNode.previousSibling;
        if (node.previousSibling != null && node.previousSibling !== undefined) {
          node.previousSibling = node.previousSibling.toString();
        }
        node.checked = rawNode.checked || false;
        node.selected = rawNode.selected || false;
        // For simplicity's sake, these values are purged from input
        // and calculated in the tree to allow simple insertion.
        node.children = [];
        node.nextSibling = null;
        // Place in correct spot in array to avoid ordering issues later.
        if (node.previousSibling === undefined) {
          nodesNoPrevious.push(node);
        } else {
          // Place before any node that has us as a previously.
          let nextIndex = nodes.findIndex(tnode => tnode.previousSibling == node.id);
          if (nextIndex > 0) {
            nodes.splice(nextIndex, 0, node);
          } else {
            nodes.push(node);
          }
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
        if (previous != null) {
          if (previous.parent != node.parent) {
            console.error("Tree Error. " + node.id + " has " + node.previousSibling + " as a previous sibling, but that node does not have the same parent.");
            errors = true;
          }
          if (previous.nextSibling != null) {
            if (newPreviousLinks.hasOwnProperty(previous.nextSibling)) {
              console.error("Tree Error. " + previous.nextSibling + " appears before two nodes.");
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
        state.nodes[pair[0]].children = pair[1];
      }
      for (let pair of Object.entries(newPreviousLinks)) {
        state.nodes[pair[0]].previousSibling = pair[1];
      }
      for (let pair of Object.entries(newNextLinks)) {
        state.nodes[pair[0]].nextSibling = pair[1];
      }

      // Update the parent's references
      // TODO: only do at end to avoid redoing work.
      for (let node of nodes) {
        updateAncestorCheck(state, node.parent);
        updateAncestorSelect(state, node.parent);
      }
    },
    checkNode(state, {nodeID, newValue}) {
      let node;
      // Deal with single check trees
      if (state.singleCheckOnly) {
        node = state.nodes[nodeID];
        if (node.children.length > 0) {
          return;
        } else {
          node.checked = newValue;
          return;
        }
      }
      let checkList = [nodeID];
      // Check self and descendants
      while (checkList.length > 0) {
        node = state.nodes[checkList.pop()];
        // If we don't need to change anything, we can
        // stop navigating down this branch.
        if (node.checked !== newValue) {
          node.checked = newValue;
          checkList = checkList.concat(node.children);
        }
      }
      // Update status of ancestors
      updateAncestorCheck(state, state.nodes[nodeID].parent);
    },
    selectNode(state, {nodeID, newValue}) {
      // Skip if not using separate selection
      if (!state.separateSelection) return;
      let selectList = [nodeID];
      let node;
      // Select self and descendants
      while (selectList.length > 0) {
        node = state.nodes[selectList.pop()];
        // If we don't need to change anything, we can
        // stop navigating down this branch.
        if (node.selected !== newValue) {
          node.selected = newValue;
          selectList = selectList.concat(node.children);
        }
      }
      // Update status of ancestors
      updateAncestorSelect(state, state.nodes[nodeID].parent);
    },
    deleteNode(state, {nodeID}) {
      let node = state.nodes[nodeID];
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
    editText(state, {nodeID, newValue}) {
      let node = state.nodes[nodeID];
      node.text = newValue;
    },
    editIcon(state, {nodeID, newValue}) {
      let node = state.nodes[nodeID];
      node.icon = newValue;
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
        let oldPrev = state.nodes[node.previousSibling];
        oldPrev.nextSibling = node.nextSibling;
      }
      if (node.nextSibling != null) {
        let oldNext = state.nodes[node.nextSibling];
        oldNext.previousSibling = node.previousSibling;
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
        newNext = state.nodes[state.rootNodes[0]];
        newNext.previousSibling = nodeID;
      } else if (newParent.children.length > 0) {
        newNext = state.nodes[newParent.children[0]];
        newNext.previousSibling = nodeID;
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
      node.previousSibling = newPreviousID;
      node.nextSibling = newNextID;
      node.parent = newParentID;
      // Update new and old ancestors
      updateAncestorCheck(state, newParentID);
      updateAncestorSelect(state, newParentID);
      updateAncestorCheck(state, oldParentID);
      updateAncestorSelect(state, oldParentID);
    },
    setSingleCheckOnly(state, newValue) {
      state.singleCheckOnly = newValue;
      for (let node of Object.values(state.nodes)) {
        node.checked = false;
      }
    },
    setSeparateSelection(state, newValue) {
      state.separateSelection = newValue;
      for (let node of Object.values(state.nodes)) {
        node.selected = false;
      }
    },
    setAllowedChildrenCheck(state, newValue) {
      state.allowedChildrenCheck = newValue;
    },
    saveCurrentTreeState(state, treeStateName) {
      let newTreeState = [];
      for (let node of Object.values(state.nodes)) {
        if (node.checked === true && node.children.length == 0) {
          newTreeState.push(node.id);
        }
      }
      Vue.set(state.treestates, treeStateName, newTreeState);
    },
    switchToTreeState(state, treeStateName) {
      if(state.treestates[treeStateName] === undefined) {
        console.error("State " + treeStateName + " could not be found.");
        return;
      }
      let goalTreeState = state.treestates[treeStateName];
      for (let node of Object.values(state.nodes)) {
        if (goalTreeState.includes(node.id)) {
          node.checked = true;
        } else {
          node.checked = false;
        }
        // TODO: Track already touched to avoid redoing work.
        updateAncestorCheck(state, node.parent);
      }
    },
    addTreeState(state, {treeStateName, treeStateData}) {
      Vue.set(state.treestates, treeStateName, treeStateData);
    },
    clear(state) {
      state.treestates = { default: {}};
      state.nodes = {};
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
      let checkChildren = state.nodes[id].children.slice(0);
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
    getTreeStateNames(state) {
      return Object.keys(state.treestates);
    },
    getTreeState: (state) => (treeStateName) => {
      return state.treestates[treeStateName];
    }
  },
  actions: {
    saveCurrentTreeState: {
      root: true,
      handler(context, treeStateName) {
        context.commit('saveCurrentTreeState', treeStateName)
      }
    },
    switchToTreeState: {
      root: true,
      handler(context, treeStateName) {
        context.commit('switchToTreeState', treeStateName)
      }
    },
    checkNode: {
      root: false,
      handler(context, payload) {
        context.commit('checkNode', payload)
      }
    },
    selectNode: {
      root: false,
      handler(context, payload) {
        context.commit('selectNode', payload)
      }
    },
  }
}