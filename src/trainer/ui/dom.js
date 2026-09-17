export function el(tag, {text, attrs} = {}, children = []) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = String(text);
  for (const [name, value] of Object.entries(attrs ?? {})) {
    if (value === false || value === null || value === undefined) continue;
    if (value === true) node.setAttribute(name, '');
    else node.setAttribute(name, String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function field(labelText, input) {
  return el('label', {text: labelText}, [input]);
}

export function button(text, onClick, attrs = {}) {
  const node = el('button', {text, attrs: {type: 'button', ...attrs}});
  node.addEventListener('click', onClick);
  return node;
}

export function message(text, tone = 'info') {
  return el('p', {text, attrs: {class: 'message', 'data-tone': tone, role: tone === 'error' ? 'alert' : 'status'}});
}
