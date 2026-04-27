export const qcmTemplate = `\\element{ {{ ref }} }{
\\begin{ {{ "questionmult" if mode == "mult" else "question" }} }{ {{ id }} }

{{ enonce | safe }}

\\begin{ {{ layout }} }{% if ordered %}[o]{% endif %}
{% for p in propositions %}
  {% if lastChoice is defined and lastChoice is not none and loop.index0 == lastChoice %}\\lastchoices{% endif %}{% if p.correct %}\\bonne{ {{- p.texte | safe -}} }{% else %}\\mauvaise{ {{- p.texte | safe -}} }{% endif %}
{% endfor %}
\\end{ {{ layout }} }

\\end{ {{ "questionmult" if mode == "mult" else "question" }} }
}`
