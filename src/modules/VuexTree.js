export default {
  state: { 
    nodes: [],
    singleCheckOnly: false,
    separateSelection: true,
  },
  mutations: {
    addNode(state, node) {
      state.nodes.push(node)
      //Vue.set(state.nodes, node.id, node)
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
  },
  getters: {
    getCheckedNodes (state) {
      return state.nodes.filter(node => node.checked === true)
    },
    getSelectedNodes (state) {
      return state.nodes.filter(node => node.selected)
    },
    getNodeChildren: (state) => (id) => {
      if (typeof id === 'undefined') {
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
  },
  actions: {
    addNodes(context, nodes) {
      for (let node of nodes) {
        context.dispatch('addNode', node)
      }
    },
    addNode (context, rawNode) {
      let node = {};
      node.id = rawNode.id || "t" + Math.floor(Date.now()); //TODO: need to filter out duplicates
      node.text = rawNode.text || "New Node";
      node.checked = rawNode.checked || false;
      node.selected = rawNode.selected || false;
      node.parent = rawNode.parent || null;
      let previousSibling = null;
      if (typeof rawNode.previousSibling === 'undefined') {
          let siblings = context.getters.getNodeChildren(node.parent)
          if (siblings.length > 0) {
              previousSibling = siblings[siblings.length - 1].id
          }
      }
      node.previousSibling = rawNode.previousSibling || previousSibling;
      node.editingText = false;
      context.commit('addNode', node)
      if (node.parent != null) {
        context.dispatch('updateCheck', node.parent);
        context.dispatch('updateSelect', node.parent);
      }
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
          if (!context.state.singleCheckOnly) {
            context.dispatch('updateCheck', node.parent);
          }
      }
    },
    checkSelfAndDescendants(context, {nodeID, oldValue, newValue}) {
      if (oldValue != newValue) {
        context.commit('checkNode', {nodeID, newValue})
        if (context.state.singleCheckOnly) return;
        for (let child of context.getters.getNodeChildren(nodeID)) {
          context.dispatch('checkSelfAndDescendants', {nodeID: child.id, oldValue: child.checked,  newValue});
        }
      }
    },
    updateCheck(context, nodeID) {
      if (nodeID == null) return;
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
  }
}
