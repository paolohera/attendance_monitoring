import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

function sanitizeFilename(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'event'
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ssc' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, title, location, start_time, requires_time_out')
    .eq('id', eventId)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  }

  const { data: attendance } = await supabase
    .from('attendance')
    .select('student_id, time_in, time_out, status')
    .eq('event_id', eventId)
    .order('time_in', { ascending: true })

  const studentIds = attendance?.map((a) => a.student_id) ?? []

  const [{ data: students }, { data: profiles }] = await Promise.all([
    studentIds.length
      ? supabase.from('students').select('id, student_id, section').in('id', studentIds)
      : Promise.resolve({ data: [] as { id: string; student_id: string; section: string }[] }),
    studentIds.length
      ? supabase.from('profiles').select('id, full_name, role').in('id', studentIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; role: string }[] }),
  ])

  const timeZone = 'Asia/Manila'
  const fmtTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone,
        })
      : ''

  const sheetRows = (attendance ?? []).map((a) => {
    const student = students?.find((s) => s.id === a.student_id)
    const attendeeProfile = profiles?.find((p) => p.id === a.student_id)
    const role = attendeeProfile?.role ?? 'student'

    return {
      Name: attendeeProfile?.full_name ?? 'Unknown',
      Role: role,
      'Student ID': role === 'student' ? student?.student_id ?? '' : '',
      Section: role === 'student' ? student?.section ?? '' : '',
      Status: a.status === 'late' ? 'Late' : 'Present',
      'Time In': fmtTime(a.time_in),
      'Time Out': fmtTime(a.time_out),
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(sheetRows, {
    header: ['Name', 'Role', 'Student ID', 'Section', 'Status', 'Time In', 'Time Out'],
  })

  // Reasonable column widths so the file doesn't open all-squished.
  worksheet['!cols'] = [
    { wch: 28 }, // Name
    { wch: 10 }, // Role
    { wch: 14 }, // Student ID
    { wch: 14 }, // Section
    { wch: 10 }, // Status
    { wch: 12 }, // Time In
    { wch: 12 }, // Time Out
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  const filename = `${sanitizeFilename(event.title)}-attendance.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}