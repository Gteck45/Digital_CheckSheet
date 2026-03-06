const InspectionSlot = require('../models/inspectionSlotModel');
const { getSlotStatus, parseHHMM } = require('../utils/slotStatus');

function normalizeTimeStr(t) {
  // Accept "HH:MM" or "HH:MM:SS"
  if (!t) return "";
  const parts = String(t).split(":");
  const hh = parts[0]?.padStart(2, "0") ?? "00";
  const mm = parts[1]?.padStart(2, "0") ?? "00";
  return `${hh}:${mm}:00`;
}

function intervalToMinutes(start_time, end_time) {
  const s = parseHHMM(start_time);
  const eRaw = parseHHMM(end_time);
  const crosses = eRaw <= s;
  const e = crosses ? eRaw + 1440 : eRaw;
  return { s, e };
}

function overlaps(a, b) {
  // a: {s,e}, b:{s,e} both in minutes (may be >1440)
  // Handle wrap by also checking shifted copies (+1440) for safety
  const candidatesA = [a, { s: a.s + 1440, e: a.e + 1440 }];
  const candidatesB = [b, { s: b.s + 1440, e: b.e + 1440 }];

  for (const aa of candidatesA) {
    for (const bb of candidatesB) {
      if (aa.s < bb.e && bb.s < aa.e) return true;
    }
  }
  return false;
}

class InspectionSlotController {

  // Get All (paged + search)
  static async getAll(req, res) {
    try {
      const search = String(req.query.search || "").trim();
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
      const offset = (page - 1) * limit;

      const total = await InspectionSlot.count(search);
      const rows = await InspectionSlot.getPaged(search, offset, limit);

      const enriched = rows.map((slot) => ({
        ...slot,
        runtime_status: getSlotStatus(slot),
      }));

      res.json({
        success: true,
        data: {
          slots: enriched,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Get One
  static async getOne(req, res) {
    try {
      const slot = await InspectionSlot.getById(req.params.id);

      if (!slot) {
        return res.status(404).json({ success: false, message: 'Slot not found' });
      }

      res.json({
        success: true,
        data: {
          ...slot,
          runtime_status: getSlotStatus(slot),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Summary (dashboard)
  static async summary(req, res) {
    try {
      const rows = await InspectionSlot.getAllRaw();

      const stats = {
        total: rows.length,
        open: 0,
        locked: 0,
        grace: 0,
        upcoming: 0,
      };

      rows.forEach((slot) => {
        const st = getSlotStatus(slot);
        if (st === "OPEN") stats.open++;
        else if (st === "LOCKED") stats.locked++;
        else if (st === "GRACE") stats.grace++;
        else if (st === "UPCOMING") stats.upcoming++;
      });

      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Create
  static async create(req, res) {
    try {
      const {
        slot_id,
        shift,
        start_time,
        end_time,
        fill_window,
        grace_period,
      } = req.body;

      if (!slot_id || !shift || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'Required fields missing (slot_id, shift, start_time, end_time)',
        });
      }

      if (!["A", "B", "C"].includes(String(shift).toUpperCase())) {
        return res.status(400).json({ success: false, message: "Invalid shift (A/B/C)" });
      }

      // Normalize time
      const sTime = normalizeTimeStr(start_time);
      const eTime = normalizeTimeStr(end_time);

      // Overlap check (within same shift)
      const existing = await InspectionSlot.getByShift(String(shift).toUpperCase(), null);
      const newInterval = intervalToMinutes(sTime, eTime);

      const isOverlap = existing.some((r) => {
        const oldInterval = intervalToMinutes(r.start_time, r.end_time);
        return overlaps(newInterval, oldInterval);
      });

      if (isOverlap) {
        return res.status(400).json({
          success: false,
          message: "Slot timing overlaps with existing slot in same shift",
        });
      }

      await InspectionSlot.create(
        String(slot_id).trim(),
        String(shift).toUpperCase(),
        sTime,
        eTime,
        Number(fill_window ?? 120),
        Number(grace_period ?? 10)
      );

      res.json({ success: true, message: 'Inspection Slot created' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update
  static async update(req, res) {
    try {
      const id = req.params.id;
      const body = { ...req.body };

      // If time fields provided, normalize them
      if (body.start_time !== undefined) body.start_time = normalizeTimeStr(body.start_time);
      if (body.end_time !== undefined) body.end_time = normalizeTimeStr(body.end_time);
      if (body.shift !== undefined) body.shift = String(body.shift).toUpperCase();

      // Fetch current row to know final values
      const current = await InspectionSlot.getById(id);
      if (!current) {
        return res.status(404).json({ success: false, message: "Slot not found" });
      }

      const final = {
        ...current,
        ...body,
      };

      if (!final.slot_id || !final.shift || !final.start_time || !final.end_time) {
        return res.status(400).json({ success: false, message: "Invalid data" });
      }

      if (!["A", "B", "C"].includes(String(final.shift).toUpperCase())) {
        return res.status(400).json({ success: false, message: "Invalid shift (A/B/C)" });
      }

      // Overlap check on update (exclude current id)
      const existing = await InspectionSlot.getByShift(String(final.shift).toUpperCase(), id);
      const updInterval = intervalToMinutes(final.start_time, final.end_time);

      const isOverlap = existing.some((r) => {
        const oldInterval = intervalToMinutes(r.start_time, r.end_time);
        return overlaps(updInterval, oldInterval);
      });

      if (isOverlap) {
        return res.status(400).json({
          success: false,
          message: "Updated timing overlaps with existing slot in same shift",
        });
      }

      await InspectionSlot.update(id, body);

      res.json({ success: true, message: 'Inspection Slot updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Hard Delete
  static async hardDelete(req, res) {
    try {
      await InspectionSlot.hardDelete(req.params.id);
      res.json({ success: true, message: 'Inspection Slot deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

}

module.exports = InspectionSlotController;