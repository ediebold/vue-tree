import Vue from 'vue';

export default {
  namespaced: true,
  state: { 
    nodes: [],
    singleCheckOnly: false,
    separateSelection: true,
    newIDCount: 0,
    allowedChildrenCheck: null,
    states: { default: {}},
  },
  mutations: {
    addNodes(state, nodes) {
      for (let node of nodes) {
        let defaultCheck = node.checked;
        if (defaultCheck == null && node.parent) {
          let parent = state.nodes.find(parentNode => parentNode.id == node.parent);
          node.checked = parent.checked === true ? true : false;
          defaultCheck = state.states.default[parent.id] === true ? true : false;
        } else if (defaultCheck == null) {
          node.checked == false;
        }
        state.nodes.push(node)
        Vue.set(state.states.default, node.id, defaultCheck);
      }
    },
    checkNode(state, {nodeID, newValue}) {
      let node = state.nodes.find(node => node.id == nodeID);
      node.checked = newValue;
    },
    selectNode(state, {nodeID, newValue}) {
      let node = state.nodes.find(node => node.id == nodeID);
      node.selected = newValue;
    },
    changePreviousSibling(state, {nodeID, newPrevious}) {
      let node = state.nodes.find(node => node.id == nodeID);
      node.previousSibling = newPrevious;
    },
    changeParent(state, {nodeID, newParent}) {
      let node = state.nodes.find(node => node.id == nodeID);
      node.previousSibling = newParent;
    },
    deleteNode(state, {nodeID, nextID}) {
      let index = state.nodes.findIndex(node => node.id == nodeID)
      let node = state.nodes[index];
      if (nextID != null) {
        let next = state.nodes.find(node => node.id == nextID);
        next.previousSibling = node.previousSibling;
      }
      state.nodes.splice(index,1);
    },
    editText(state, {nodeID, newValue}) {
      let node = state.nodes.find(node => node.id == nodeID);
      node.text = newValue;
    },
    editIcon(state, {nodeID, newValue}) {
      let node = state.nodes.find(node => node.id == nodeID);
      node.icon = newValue;
    },
    moveNode(state, {nodeID, newParentID, newPreviousID, newNextID, oldNextID}) {
      let node = state.nodes.find(node => node.id == nodeID);
      // Remove nodeID from old sibling list if necessary
      if (oldNextID != null) {
        let oldNext = state.nodes.find(node => node.id == oldNextID);
        oldNext.previousSibling = node.previousSibling;
      }
      // Add nodeID into new sibling list if necessary
      if (newNextID != null) {
        let newNext = state.nodes.find(node => node.id == newNextID);
        newNext.previousSibling = nodeID;
      }
      // Update nodeID's references
      node.previousSibling = newPreviousID;
      node.parent = newParentID;
    },
    recheckAll(state, newValue) {
      for (let node of state.nodes) {
        node.checked = newValue;
      }
    },
    reselectAll(state, newValue) {
      for (let node of state.nodes) {
        node.selected = newValue;
      }
    },
    setSingleCheckOnly(state, newValue) {
      state.singleCheckOnly = newValue;
    },
    setSeparateSelection(state, newValue) {
      state.separateSelection = newValue;
    },
    incrementNewIDCount(state) {
      state.newIDCount += 1;
    },
    setAllowedChildrenCheck(state, newValue) {
      state.allowedChildrenCheck = newValue;
    },
    saveState(state, stateName) {
      if (stateName == "default") {
        let defaults = {};
        for (let node of state.nodes) {
          defaults[node.id] = node.checked;
        }
        Vue.set(state.states, 'default', defaults);
        return;
      }
      let defaults = state.states.default;
      let newState = {};
      for (let node of state.nodes) {
        if (node.checked != defaults[node.id]) {
          newState[node.id] = node.checked;
        }
      }
      Vue.set(state.states, stateName, newState);
    },
    switchState(state, stateName) {
      if(!state.states[stateName]) {
        console.error("State " + stateName + " could not be found.");
        return;
      }
      let goalState = state.states[stateName];
      let defaults = state.states.default;
      for (let node of state.nodes) {
        node.checked = goalState[node.id] || defaults[node.id];
      }
    },
  },
  getters: {
    getCheckedNodes (state) {
      let checkedNodes = state.nodes.filter(node => node.checked === true);
      if (checkedNodes.length > 1 && state.singleCheckOnly) {
        let parentIDs = checkedNodes.map(node => node.parent);
        return [checkedNodes.find(node => !parentIDs.includes(node.id))];
      }
      return checkedNodes;
    },
    getSelectedNodes (state) {
      return state.nodes.filter(node => node.selected)
    },
    getNodeChildren: (state) => (id) => {
      if (state.nodes[0]) {
      }
      if (id === undefined) {
        id = null;
      }
      let unsortedChildren = state.nodes.filter(node => node.parent == id);
      if (unsortedChildren.length <= 1) return unsortedChildren;
      let sortedChildren = [];
      let nextID = null;
      while (unsortedChildren.length > 0) {
        let next = unsortedChildren.findIndex(node => node.previousSibling == nextID);
        nextID = unsortedChildren[next].id;
        sortedChildren.push(unsortedChildren[next])
        unsortedChildren.splice(next, 1);
      }
      return sortedChildren;
    },
    getNode: (state) => (id) => {
      return state.nodes.find(node => node.id == id);
    },
    getNextSiblingNode: (state) => (id) => {
      return state.nodes.find(node => node.previousSibling == id);
    },
    getNewIDCount (state) {
      return state.newIDCount;
    },
    getAllLeaves (state) {
      return state.nodes.filter(node => state.nodes.filter(innerNode => innerNode.parent = node.id).length === 0);
    },
    getLeaves: (state) => (id) => {
      let leaves = [];
      let checkChildren = state.nodes.filter(child => child.parent === id);
      let newChildren = [];
      let curNode = null;
      if (checkChildren.length < 1) return [id];
      while (checkChildren.length > 0) {
        curNode = checkChildren.pop().id;
        newChildren = state.nodes.filter(child => child.parent === curNode);
        if (newChildren.length == 0) {
          leaves.push(curNode);
        } else {
          checkChildren = checkChildren.concat(newChildren);
        }
      }
      return leaves;
    },
    getStates(state) {
      return Object.keys(state.states);
    }
  },
  actions: {
    addNodes(context, rawNodes) {
      let nodes = [];
      let parents = [];
      let newLastChild = {};
      for (let rawNode of rawNodes) {
        let node = {};
        if (rawNode.id !== undefined && context.getters.getNode(rawNode.id)) {
          console.error("A tree entry with id " + rawNode.id + " already exists");
          continue;
        }
        node.id = rawNode.id || "t" + context.getters.getNewIDCount;
        if (typeof node.id === 'string') {
          context.commit('incrementNewIDCount');
        }
        node.text = rawNode.text || "New Node";
        node.icon = rawNode.icon || "";
        node.parent = rawNode.parent || null;
        if (node.parent && context.state.allowedChildrenCheck != null) {
          let parent =  context.getters.getNode(node.parent) || rawNodes.find(parentNode => parentNode.id === node.parent);
          if (!context.state.allowedChildrenCheck(parent)) {
            console.error("Node " + node.parent + " is not allowed to have children.");
            continue;
          }
        }
        if (parents.indexOf(node.parent) === -1) {
          parents.push(node.parent);
        }
        node.checked = rawNode.checked || null;
        if (node.checked == null && !node.parent) {
          node.checked = false;
        }
        node.selected = rawNode.selected || false;
        let previousSibling = null;
        if (rawNode.previousSibling === undefined) {
          if (newLastChild[node.parent] !== undefined) {
            previousSibling = newLastChild[node.parent];
            newLastChild[node.parent] = node.id;
          } else {
            let siblings = context.getters.getNodeChildren(node.parent)
            if (siblings.length > 0) {
              previousSibling = siblings[siblings.length - 1].id
            }
            newLastChild[node.parent] = node.id;
          }
        }
        node.previousSibling = rawNode.previousSibling || previousSibling;
        
        let child = nodes.findIndex(prevNode => prevNode.parent == node.id);
        let prev = nodes.findIndex(prevNode => prevNode.previousSibling == node.id);
        if (child === -1 && prev === -1) {
          nodes.push(node);
        } else if (child === -1) {
          nodes.splice(child, 0, node);
        } else if (prev === -1) {
          nodes.splice(prev, 0, node);
        } else {
          nodes.splice(Math.min(child, prev), 0, node);
        }
      }
      console.log("immediately before add", nodes[0].id, nodes[0].parent)
      context.commit('addNodes', nodes)
      console.log("immediately after add", nodes[0].id, nodes[0].parent)
      console.log("immediately after ad2", context.state.nodes[0].id, context.state.nodes[0].parent)
      for (let parent of parents) {
        context.dispatch('updateCheck', parent);
        context.dispatch('updateSelect', parent);
      }
      console.log(context.state);
    },
    addNode (context, rawNode) {
      context.dispatch('addNodes', [rawNode]);
    },
    checkNode(context, {nodeID, newValue}) {
      // Uncheck other if in single check mode
      if (newValue && context.state.singleCheckOnly) {
        let checkedNodes = context.getters.getCheckedNodes;
        if (checkedNodes.length > 0) {
          context.commit('checkNode', {nodeID: context.getters.getCheckedNodes[0].id, newValue: false});
        }
      }
      let node = context.getters.getNode(nodeID);
      let oldValue = node.checked
      if (oldValue != newValue) {
          context.dispatch('checkSelfAndDescendants', {nodeID: node.id, oldValue: node.checked, newValue});
          context.dispatch('updateCheck', node.parent);
      }
    },
    checkSelfAndDescendants(context, {nodeID, oldValue, newValue}) {
      if (oldValue != newValue) {
        context.commit('checkNode', {nodeID, newValue})
        if (context.state.singleCheckOnly && newValue) return;
        for (let child of context.getters.getNodeChildren(nodeID)) {
          context.dispatch('checkSelfAndDescendants', {nodeID: child.id, oldValue: child.checked,  newValue});
        }
      }
    },
    updateCheck(context, nodeID) {
      if (nodeID == null) return;
      console.log("check", nodeID)
      let node = context.getters.getNode(nodeID);
      let checked = null;
      for (let child of context.getters.getNodeChildren(nodeID)) {
        if (child.checked != checked && checked != null) {
          checked = "indet";
          break;
        } else if (checked == null) {
          checked = child.checked;
        }
      }
      let oldChecked = node.checked;

      context.commit('checkNode', {nodeID, newValue: checked})
      if (oldChecked != checked) {
        context.dispatch('updateCheck', node.parent);
      }
    },
    selectNode(context, {nodeID, newValue}) {
      if (!context.state.separateSelection) return;
      let node = context.getters.getNode(nodeID);
      let oldValue = node.selected
      context.dispatch('selectSelfAndDescendants', {nodeID: node.id, newValue});
      if (oldValue != newValue) {
          context.dispatch('updateSelect', node.parent);
      }
    },
    selectSelfAndDescendants(context, {nodeID, newValue}) {
      context.commit('selectNode', {nodeID, newValue})
      for (let child of context.getters.getNodeChildren(nodeID)) {
        context.dispatch('selectSelfAndDescendants', {nodeID: child.id, oldValue: child.selected, newValue});
      }
    },
    updateSelect(context, nodeID) {
      if (nodeID == null) return;
      let node = context.getters.getNode(nodeID);
      let selected = null;
      for (let child of context.getters.getNodeChildren(nodeID)) {
        if (child.selected != selected && selected != null) {
          selected = false;
          break;
        } else if (selected == null) {
          selected = child.selected;
        }
      }
      let oldSelected = node.selected;
      context.commit('selectNode', {nodeID, newValue: selected})
      if (oldSelected != selected) {
        context.dispatch('updateSelect', node.parent);
      }
    },
    makeChild(context, {nodeID, newParentID}) {
      let node = context.getters.getNode(nodeID);
      let newParent = context.getters.getNode(newParentID);
      // Check if we can just skip doing anything
      if (nodeID == newParentID) return;
      if (node.parent == newParentID) return;
      // Get last child as the new previousSibling
      let newPreviousID = null;
      let newSiblings = context.getters.getNodeChildren(newParentID);
      if (newSiblings.length > 0) {
        newPreviousID = newSiblings[newSiblings.length - 1].id
      }
      // Get the oldNext node to update it's references
      let oldNext = context.getters.getNextSiblingNode(nodeID);
      let oldNextID = oldNext ? oldNext.id : null;

      context.commit('moveNode', {nodeID, newParentID, newPreviousID, newNextID: null, oldNextID})
      // Update parent status
      if (node.parent != null) {
        context.dispatch('updateCheck', node.parent);
        context.dispatch('updateSelect', node.parent);
        context.dispatch('updateCheck', newParent.id);
        context.dispatch('updateSelect', newParent.id);
      }
    },
    moveAfter(context, {nodeID, newPreviousID}) {
      let node = context.getters.getNode(nodeID);
      // Check if we can just skip doing anything
      if (nodeID == newPreviousID) return;
      if (node.previousSibling == newPreviousID) return;
      // Get the new parent
      let newPrevious = context.getters.getNode(newPreviousID);
      let newParentID = newPrevious.parent;
      // Get the new next node
      let newNextID = null;
      let newNext = context.getters.getNextSiblingNode(newPreviousID);
      if (newNext) {
        newNextID = newNext.id;
      }
      // Get the oldNext node to update it's references
      let oldNext = context.getters.getNextSiblingNode(nodeID);
      let oldNextID = oldNext ? oldNext.id : null;

      context.commit('moveNode', {nodeID, newParentID, newPreviousID, newNextID, oldNextID})
      // Update parent status      
      if (node.parent != null) {
        context.dispatch('updateCheck', node.parent);
        context.dispatch('updateSelect', node.parent);
        context.dispatch('updateCheck', newParentID);
        context.dispatch('updateSelect', newParentID);
      }
    },
    deleteNode(context, nodeID) {
      let next = context.getters.getNextSiblingNode(nodeID);
      let nextID = next ? next.id : null;
      context.commit('deleteNode', {nodeID, nextID});
    },
    changeSingleCheck(context, newValue) {
      context.commit('recheckAll', false);
      context.commit('setSingleCheckOnly', newValue);
    },
    changeSeparateSelection(context, newValue) {
      context.commit('reselectAll', false);
      context.commit('setSeparateSelection', newValue);
    },
    changeAllowedChildrenCheck(context, newValue) {
      context.commit('setAllowedChildrenCheck', newValue);
    },
    switchState(context, stateName) {
      context.commit('switchState', stateName);
      for (let node of Object.keys(context.state.states[stateName])) {
        context.dispatch('checkSelfAndDescendants', {nodeID: node.id, oldValue: node.checked, newValue: context.state.states[stateName][node.id]});
        context.dispatch('updateCheck', node.parent);
      }
    }
  },
}
