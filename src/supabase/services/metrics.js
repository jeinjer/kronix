import { supabase } from "../supabaseClient";

export async function getOrganizationMetrics(organizationId) {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const firstDayIso = startOfMonth.toISOString();

    // Fetch staff
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("id, name, is_active")
      .eq("organization_id", organizationId);

    if (staffError) throw staffError;

    const activeStaff = staffData.filter(s => s.is_active);
    const staffIds = activeStaff.map(s => s.id);

    // Fetch appointments for this month
    const { data: apptData, error: apptError } = await supabase
      .from("appointments")
      .select("id, staff_id, start_time")
      .eq("organization_id", organizationId)
      .gte("start_time", firstDayIso)
      .neq("status", "canceled")
      .is("deleted_at", null);

    if (apptError) throw apptError;

    // Empleado del mes
    const staffCounts = {};
    apptData.forEach(appt => {
      if (appt.staff_id) {
        staffCounts[appt.staff_id] = (staffCounts[appt.staff_id] || 0) + 1;
      }
    });

    let bestStaffId = null;
    let maxAppts = -1;
    for (const [sId, count] of Object.entries(staffCounts)) {
      if (count > maxAppts) {
        maxAppts = count;
        bestStaffId = sId;
      }
    }

    let employeeOfTheMonth = "N/A";
    if (bestStaffId) {
      const found = activeStaff.find(s => String(s.id) === String(bestStaffId));
      if (found) employeeOfTheMonth = found.name;
    }

    // Fetch schedules to calculate capacity
    let totalCapacity = 0;
    if (staffIds.length > 0) {
      const { data: schedData, error: schedError } = await supabase
        .from("staff_schedules")
        .select("staff_id, day_of_week, start_time, end_time")
        .in("staff_id", staffIds);

      if (!schedError && schedData) {
        const capacityPerWeek = schedData.reduce((acc, curr) => {
          const start = new Date(`1970-01-01T${curr.start_time}Z`);
          const end = new Date(`1970-01-01T${curr.end_time}Z`);
          const slots = Math.max(0, Math.floor(((end - start) / 60000) / 30));
          return acc + slots;
        }, 0);
        
        // Rough estimate for the month (assume 4.33 weeks per month)
        totalCapacity = Math.floor(capacityPerWeek * 4.33);
      }
    }

    const totalAppointments = apptData.length;
    let occupancyRate = 0;
    if (totalCapacity > 0) {
      occupancyRate = Math.min(100, Math.round((totalAppointments / totalCapacity) * 100));
    }

    return {
      success: true,
      data: {
        totalAppointments,
        occupancyRate,
        employeeOfTheMonth,
        activeStaffCount: activeStaff.length,
      }
    };
  } catch (err) {
    console.error("Error fetching metrics", err);
    return { success: false, data: null };
  }
}

export async function getGlobalMetrics(userId) {
  try {
    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", userId);

    if (orgError) throw orgError;
    if (!orgs || orgs.length === 0) {
      return { success: true, data: { totalAppointments: 0, occupancyRate: 0, employeeOfTheMonth: "N/A", activeStaffCount: 0 } };
    }

    let totalAppts = 0;
    let totalCap = 0;
    let totalStaff = 0;
    const globalStaffCounts = {};
    const staffNames = {};

    for (const org of orgs) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const firstDayIso = startOfMonth.toISOString();

      const { data: staffData } = await supabase
        .from("staff")
        .select("id, name, is_active")
        .eq("organization_id", org.id);

      const activeStaff = (staffData || []).filter(s => s.is_active);
      totalStaff += activeStaff.length;
      activeStaff.forEach(s => {
        staffNames[s.id] = s.name;
      });

      const staffIds = activeStaff.map(s => s.id);

      const { data: apptData } = await supabase
        .from("appointments")
        .select("id, staff_id, start_time")
        .eq("organization_id", org.id)
        .gte("start_time", firstDayIso)
        .neq("status", "canceled")
        .is("deleted_at", null);

      const orgAppts = apptData || [];
      totalAppts += orgAppts.length;

      orgAppts.forEach(appt => {
        if (appt.staff_id) {
          globalStaffCounts[appt.staff_id] = (globalStaffCounts[appt.staff_id] || 0) + 1;
        }
      });

      if (staffIds.length > 0) {
        const { data: schedData } = await supabase
          .from("staff_schedules")
          .select("staff_id, day_of_week, start_time, end_time")
          .in("staff_id", staffIds);

        if (schedData) {
          const capacityPerWeek = schedData.reduce((acc, curr) => {
            const start = new Date(`1970-01-01T${curr.start_time}Z`);
            const end = new Date(`1970-01-01T${curr.end_time}Z`);
            const slots = Math.max(0, Math.floor(((end - start) / 60000) / 30));
            return acc + slots;
          }, 0);
          totalCap += Math.floor(capacityPerWeek * 4.33);
        }
      }
    }

    let bestStaffId = null;
    let maxAppts = -1;
    for (const [sId, count] of Object.entries(globalStaffCounts)) {
      if (count > maxAppts) {
        maxAppts = count;
        bestStaffId = sId;
      }
    }

    let employeeOfTheMonth = "N/A";
    if (bestStaffId && staffNames[bestStaffId]) {
      employeeOfTheMonth = staffNames[bestStaffId];
    }

    let occupancyRate = 0;
    if (totalCap > 0) {
      occupancyRate = Math.min(100, Math.round((totalAppts / totalCap) * 100));
    }

    return {
      success: true,
      data: {
        totalAppointments: totalAppts,
        occupancyRate,
        employeeOfTheMonth,
        activeStaffCount: totalStaff,
      }
    };
  } catch (err) {
    console.error("Error fetching global metrics", err);
    return { success: false, data: null };
  }
}
