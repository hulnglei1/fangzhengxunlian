import store from '../store'

function checkPermission(el, binding) {
  const { value } = binding
  if (!value) return

  const [module, action] = value.split(':')
  const hasPermission = store.getters['permission/hasPermission'](module, action)

  if (!hasPermission) {
    el.parentNode && el.parentNode.removeChild(el)
  }
}

export default {
  inserted(el, binding) {
    checkPermission(el, binding)
  },
  update(el, binding) {
    checkPermission(el, binding)
  }
} 