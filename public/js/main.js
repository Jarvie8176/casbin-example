(() => {
  const API_URL = ".";

  async function fetchPatients() {
    setIdentity($("#identity-selection").val());
    const dataContainer = $("#data");
    dataContainer.empty();

    try {
      const container = $("<div>");
      const patientId = $("#patient-id").val();
      const fields = $("#inputs input:checkbox:checked")
        .map(function() {
          return $(this).val();
        })
        .get();
      const res = await axios.get(`${API_URL}/api/patients/${patientId ? patientId : ""}?fields=${fields.join(",")}`, {
        headers: { identity: $.cookie("identity") }
      });

      let patientDataList = _.isArray(res.data.data) ? res.data.data : [res.data.data];

      if (_.isEmpty(patientDataList)) dataContainer.append($("<p>No data</p>"));
      else {
        _.each(patientDataList, patientData =>
          container.append($("<div class='patient'>").append(JSON2HTMLList(patientData)))
        );
        dataContainer.append(container);
      }
    } catch (err) {
      dataContainer.append($(`<p>${err.message}</p><p>${JSON.stringify(_.get(err, "response.data"))}</p>`));
    }
  }

  async function fetchPatientDetails() {}

  /**
   *
   * @param user { "admin" | number }
   */
  function setIdentity(user) {
    console.log(`setIdentity(${user})`);
    switch (user) {
      case "admin":
        return $.cookie("identity", JSON.stringify({ id: 999, privilegeLevel: 999 }));
      default:
        if (user) return $.cookie("identity", JSON.stringify({ id: Number(user) }));
        console.log(`invalid user: ${user}`);
    }
  }

  window.fetchPatients = fetchPatients;
  window.setIdentity = setIdentity;
})();
