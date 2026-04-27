export const decimalTemplate = `\\element{ {{ ref }} }{
\\begin{questionmultx}{ {{ id }} }

{{ enonce }}

{% if explain %}
\\explain{ {{ explain }} }
{% endif %}

\\AMCnumericChoices{ {{ value }} }{
digits={{ digits }},
decimals={{ decimals }},
sign={{ sign }},
approx={{ approx }},
{% if options.exponent %}exponent={{ options.exponent }},{% endif %}
{% if options.exposign %}exposign={{ options.exposign }},{% endif %}
borderwidth=0pt,backgroundcol=lightgray,scoreexact=1
}

\\end{questionmultx}
}`
