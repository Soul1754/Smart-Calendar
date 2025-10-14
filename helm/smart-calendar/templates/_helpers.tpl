{{/*
Expand the name of the chart.
*/}}
{{- define "smart-calendar.name" -}}
{{- default .Chart.Name .Values.global.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "smart-calendar.fullname" -}}
{{- if .Values.global.fullnameOverride }}
{{- .Values.global.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.global.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "smart-calendar.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "smart-calendar.labels" -}}
helm.sh/chart: {{ include "smart-calendar.chart" . }}
{{ include "smart-calendar.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.additionalLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "smart-calendar.selectorLabels" -}}
app.kubernetes.io/name: {{ include "smart-calendar.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend component name
*/}}
{{- define "smart-calendar.backend.name" -}}
{{- printf "%s-backend" (include "smart-calendar.fullname" .) }}
{{- end }}

{{/*
Backend labels
*/}}
{{- define "smart-calendar.backend.labels" -}}
{{ include "smart-calendar.labels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "smart-calendar.backend.selectorLabels" -}}
{{ include "smart-calendar.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Frontend component name
*/}}
{{- define "smart-calendar.frontend.name" -}}
{{- printf "%s-frontend" (include "smart-calendar.fullname" .) }}
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "smart-calendar.frontend.labels" -}}
{{ include "smart-calendar.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "smart-calendar.frontend.selectorLabels" -}}
{{ include "smart-calendar.selectorLabels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "smart-calendar.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "smart-calendar.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
MongoDB secret name
*/}}
{{- define "smart-calendar.mongodb.secretName" -}}
{{- printf "%s-mongodb" (include "smart-calendar.fullname" .) }}
{{- end }}
