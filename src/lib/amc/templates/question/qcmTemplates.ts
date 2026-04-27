export const qcmTemplate = `\\element{ {{ ref }} }{
\\begin{ {{ mode == "mult" ? "questionmult" : "question" }} }{ {{ id }} }

{{ enonce }}

\\begin{ {{ layout }} }{% if ordered %}[o]{% endif %}
{% for p in propositions %}
  {% if lastChoice is not none and loop.index0 == lastChoice %}
    \\lastchoices
  {% endif %}
  {% if p.correct %}
    \\bonne{ {{ p.texte }} }
  {% else %}
    \\mauvaise{ {{ p.texte }} }
  {% endif %}
{% endfor %}
\\end{ {{ layout }} }

\\end{ {{ mode == "mult" ? "questionmult" : "question" }} }
}`
