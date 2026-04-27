export const powerTemplate = `\\element{ {{ ref }} }{
\\begin{multicols}{2}

\\begin{questionmultx}{ {{ id }} }
{{ enonce }}

Base

\\AMCnumericChoices{ {{ base }} }{
digits={{ digitsBase }},
decimals=0,
sign={{ signBase }},
approx=0,
borderwidth=0pt
}
\\end{questionmultx}

\\begin{questionmultx}{ {{ id }}-exp }
Exposant

\\AMCnumericChoices{ {{ exponent }} }{
digits={{ digitsExponent }},
decimals=0,
sign=true,
approx=0,
borderwidth=0pt
}
\\end{questionmultx}

\\end{multicols}
}`
